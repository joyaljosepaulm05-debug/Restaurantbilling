from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from apps.members.models import Member, CreditLedger


class CreditService:
    """
    All member credit logic lives here.

    Three rules this service enforces:
    1. Never edit a ledger entry — only append
    2. Never allow a purchase that exceeds available credit
    3. Every debit must link back to a Sale (audit trail)
    """

    @staticmethod
    def get_member_by_card(card_number: str) -> Member:
        """
        Looks up member by card number.
        Called when card is scanned at billing counter.
        Raises ValueError if not found or inactive.
        """
        card_number = card_number.upper().strip()
        try:
            member = Member.objects.select_related('home_branch').get(
                card_number=card_number,
                is_active=True
            )
            return member
        except Member.DoesNotExist:
            raise ValueError(
                f"No active member found for card '{card_number}'."
            )

    @staticmethod
    def get_member_by_phone(phone: str) -> Member:
        """
        Looks up member by phone number.
        Alternative to card scan — useful when customer forgets card.
        """
        try:
            return Member.objects.get(phone=phone, is_active=True)
        except Member.DoesNotExist:
            raise ValueError(
                f"No active member found for phone '{phone}'."
            )

    @staticmethod
    def get_balance_summary(member: Member) -> dict:
        """
        Returns the complete financial picture for a member.
        Called when the billing screen scans a card — shows
        balance before the customer confirms their order.
        """
        balance = member.current_balance
        available = member.available_credit

        return {
            'card_number':     member.card_number,
            'full_name':       member.full_name,
            'tier':            member.tier,
            'current_balance': float(balance),
            'credit_limit':    float(member.credit_limit),
            'available_credit':float(available),
            'is_in_debt':      member.is_in_debt,
            'can_spend':       float(max(available, Decimal('0'))),
        }

    @staticmethod
    def top_up(member: Member, amount: Decimal,
               created_by, description: str = '') -> CreditLedger:
        """
        Adds credit to a member's account (top-up / load money).
        Creates a POSITIVE ledger entry.

        WHY atomic: The ledger entry must either save completely
        or not at all. No half-saved financial records.
        """
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Top-up amount must be positive.")

        with transaction.atomic():
            entry = CreditLedger.objects.create(
                member      = member,
                amount      = amount,       # ← Positive
                entry_type  = CreditLedger.EntryType.CREDIT,
                description = description or f"Top-up ₹{amount}",
                created_by  = created_by,
            )

        return entry

    @staticmethod
    def debit_for_sale(member: Member, sale,
                       amount: Decimal, created_by) -> CreditLedger:
        """
        Deducts credit when a member pays a bill using their card.
        Creates a NEGATIVE ledger entry.

        WHY check available_credit BEFORE writing:
        We validate BEFORE entering the atomic block.
        If validation fails, nothing is written — clean.
        """
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Debit amount must be positive.")

        # ── Pre-flight check ─────────────────────────────────────
        available = member.available_credit
        if amount > available:
            raise ValueError(
                f"Insufficient credit. "
                f"Available: ₹{available:.2f}, "
                f"Required: ₹{amount:.2f}. "
                f"Please top up or choose another payment method."
            )

        with transaction.atomic():
            entry = CreditLedger.objects.create(
                member      = member,
                amount      = -amount,      # ← Negative = deduction
                entry_type  = CreditLedger.EntryType.DEBIT,
                sale        = sale,
                description = f"Payment for {sale.bill_number}",
                created_by  = created_by,
            )

        return entry

    @staticmethod
    def reverse_entry(original_entry_id: int, created_by,
                      reason: str = '') -> CreditLedger:
        """
        Corrects a mistake by creating an OPPOSITE entry.
        Never edits the original — that would break the audit trail.

        Example: Staff accidentally loaded ₹2000 instead of ₹200.
        Solution: Create a reversal of -₹2000, then a correct +₹200.

        WHY opposite amount:
        original: +2000 (wrong top-up)
        reversal: -2000 (cancels it out)
        new entry:+200  (correct amount)
        SUM = 200 ← correct balance
        """
        try:
            original = CreditLedger.objects.get(id=original_entry_id)
        except CreditLedger.DoesNotExist:
            raise ValueError(f"Ledger entry #{original_entry_id} not found.")

        with transaction.atomic():
            reversal = CreditLedger.objects.create(
                member      = original.member,
                amount      = -original.amount,     # Opposite sign
                entry_type  = CreditLedger.EntryType.REVERSAL,
                description = reason or f"Reversal of entry #{original_entry_id}",
                created_by  = created_by,
            )

        return reversal

    @staticmethod
    def get_statement(member: Member, limit: int = 20) -> list:
        """
        Returns the last N ledger entries for a member.
        Used for the "mini statement" printed on receipts
        and displayed in the mobile app (Phase 7).
        """
        entries = CreditLedger.objects.filter(
            member=member
        ).select_related('sale').order_by('-created_at')[:limit]

        running_balance = member.current_balance

        statement = []
        for entry in entries:
            statement.append({
                'date':        entry.created_at.isoformat(),
                'type':        entry.entry_type,
                'amount':      float(entry.amount),
                'description': entry.description,
                'bill_number': entry.sale.bill_number if entry.sale else None,
                'balance':     float(running_balance),
            })
            # Walk balance backwards through history
            running_balance -= entry.amount

        return statement