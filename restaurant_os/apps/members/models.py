from django.db import models
from django.utils import timezone
from apps.accounts.models import Branch, User
import uuid


def generate_card_number():
    """
    Generates a unique 12-digit membership card number.
    Format: MEM-XXXXXXXX (human readable, printable on card)
    WHY prefix: Distinguishes from bill numbers at a glance.
    """
    unique = uuid.uuid4().hex[:8].upper()
    return f"MEM-{unique}"


class Member(models.Model):
    """
    A restaurant loyalty/credit member.

    Design Decisions:

    1. card_number: The physical card identifier. Printed on a card,
       scanned at billing. Separate from the DB id for security —
       you don't expose sequential IDs to the public.

    2. credit_limit: How much they can go into negative balance.
       Default 0 = prepay only (can't spend more than loaded).
       Set higher for trusted/corporate accounts.

    3. is_active: Soft delete. A deactivated member cannot make
       purchases but their full ledger history is preserved.

    4. WHY no `balance` field: Balance is COMPUTED from CreditLedger.
       Storing it separately creates two sources of truth that can
       drift apart. One source of truth = the ledger.
    """

    class MemberTier(models.TextChoices):
        STANDARD  = 'STANDARD',  'Standard'
        SILVER    = 'SILVER',    'Silver'
        GOLD      = 'GOLD',      'Gold'
        PLATINUM  = 'PLATINUM',  'Platinum'

    # ── Identity ─────────────────────────────────────────────────
    card_number     = models.CharField(
                        max_length=20,
                        unique=True,
                        default=generate_card_number,
                        help_text="Physical card number e.g. MEM-AB12CD34"
                      )
    full_name       = models.CharField(max_length=150)
    phone           = models.CharField(max_length=20, unique=True)
    email           = models.EmailField(blank=True)

    # ── Tier & Credit ─────────────────────────────────────────────
    tier            = models.CharField(
                        max_length=20,
                        choices=MemberTier.choices,
                        default=MemberTier.STANDARD
                      )
    credit_limit    = models.DecimalField(
                        max_digits=10,
                        decimal_places=2,
                        default=0,
                        help_text="Max negative balance allowed. 0 = prepay only."
                      )

    # ── Branch association (optional) ────────────────────────────
    home_branch     = models.ForeignKey(
                        Branch,
                        on_delete=models.SET_NULL,
                        null=True,
                        blank=True,
                        related_name='members',
                        help_text="Primary branch. NULL = valid at all branches."
                      )

    # ── Status ────────────────────────────────────────────────────
    is_active       = models.BooleanField(default=True)
    joined_at       = models.DateTimeField(default=timezone.now)
    notes           = models.TextField(blank=True)

    class Meta:
        indexes = [
            # WHY: Billing screen looks up members by phone (fast)
            models.Index(fields=['phone'],       name='idx_member_phone'),
            # WHY: Card scanner sends card_number
            models.Index(fields=['card_number'], name='idx_member_card'),
        ]

    def __str__(self):
        return f"{self.card_number} — {self.full_name}"

    @property
    def current_balance(self):
        """
        Computes live balance from ledger entries.
        CREDIT entries are positive. DEBIT entries are negative.
        This is the ONLY way to get a member's balance.
        """
        from django.db.models import Sum
        result = self.ledger_entries.aggregate(total=Sum('amount'))
        return result['total'] or 0

    @property
    def available_credit(self):
        """
        How much the member can still spend.
        = current_balance + credit_limit
        
        Example:
          balance = +500, limit = 0    → can spend 500
          balance = -200, limit = 1000 → can spend 800
          balance = -1000, limit = 1000 → can spend 0 (at limit)
        """
        return self.current_balance + self.credit_limit

    @property
    def is_in_debt(self):
        return self.current_balance < 0


class CreditLedger(models.Model):
    """
    THE immutable financial record. Every single rupee movement.
    
    WHY immutable:
    Once created, a ledger entry is NEVER edited or deleted.
    If a mistake is made, you create a REVERSAL entry (opposite amount).
    This is how banks, accountants, and financial systems work.
    
    WHY signed amounts instead of separate debit/credit columns:
    One field tells the full story:
      +500.00 = money added (credit)
      -180.00 = money spent (debit)
    SUM of all = current balance. Simple, queryable, correct.
    
    This is the EXACT same pattern as StockLog in Phase 2.
    """

    class EntryType(models.TextChoices):
        CREDIT   = 'CREDIT',   'Credit (Top-up)'
        DEBIT    = 'DEBIT',    'Debit (Purchase)'
        REVERSAL = 'REVERSAL', 'Reversal (Correction)'
        REFUND   = 'REFUND',   'Refund'

    member      = models.ForeignKey(
                    Member,
                    on_delete=models.PROTECT,  # Can't delete a member with ledger
                    related_name='ledger_entries'
                  )

    # Positive = money in (top-up, refund)
    # Negative = money out (purchase)
    amount      = models.DecimalField(
                    max_digits=10,
                    decimal_places=2,
                    help_text="Positive=credit, Negative=debit"
                  )

    entry_type  = models.CharField(
                    max_length=20,
                    choices=EntryType.choices
                  )

    # Link to the sale that triggered this entry (optional)
    # WHY: You can trace every debit back to its exact bill
    sale        = models.ForeignKey(
                    'billing.Sale',
                    on_delete=models.SET_NULL,
                    null=True,
                    blank=True,
                    related_name='credit_entries'
                  )

    description = models.CharField(max_length=255, blank=True)
    created_by  = models.ForeignKey(
                    User,
                    on_delete=models.SET_NULL,
                    null=True,
                    related_name='ledger_entries_created'
                  )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            # WHY: Statement view always queries by member + date range
            models.Index(
                fields=['member', 'created_at'],
                name='idx_ledger_member_date'
            ),
        ]

    def __str__(self):
        sign = '+' if self.amount >= 0 else ''
        return f"{self.member.card_number} | {sign}{self.amount} | {self.entry_type}"