from django.db import models
from django.utils import timezone
from apps.accounts.models import User, Branch
from apps.inventory.models import MenuItem
import uuid


def generate_bill_number():
    """
    WHY this format: BILL-20260423-0001
    Human readable, date-sortable, unique per day.
    The 4-digit suffix resets each day.
    In production, use a database sequence for guaranteed uniqueness.
    """
    today = timezone.now().strftime('%Y%m%d')
    # Count today's bills and add 1
    count = Sale.objects.filter(
        created_at__date=timezone.now().date()
    ).count() + 1
    return f"BILL-{today}-{count:04d}"


class Sale(models.Model):
    """
    The master record for one complete customer transaction.

    Design Decisions:
    
    1. bill_number: Human-readable, printed on receipt.
       The UUID `id` is for DB relations, bill_number is for humans.
       
    2. subtotal / tax_total / total: Stored DENORMALIZED.
       WHY: You could recalculate from SaleItems every time.
       But prices change. If Biryani was ₹180 in March and ₹200 in April,
       the March bills must still show ₹180. Storing the totals freezes them.
       
    3. status: A sale moves through states. PENDING means the order
       is open. PAID means payment received. VOID means cancelled.
       
    4. payment_method: Stored as a summary on the Sale for quick reporting.
       Detailed split is in the Payment model.
    """

    class Status(models.TextChoices):
        PENDING   = 'PENDING',   'Pending'
        PAID      = 'PAID',      'Paid'
        VOID      = 'VOID',      'Voided'

    class PaymentMethod(models.TextChoices):
        CASH      = 'CASH',      'Cash'
        CARD      = 'CARD',      'Card'
        UPI       = 'UPI',       'UPI'
        CREDIT    = 'CREDIT',    'Member Credit'
        SPLIT     = 'SPLIT',     'Split Payment'

    # ── Identity ─────────────────────────────────────────────────
    bill_number     = models.CharField(
                        max_length=30,
                        unique=True,
                        default=generate_bill_number
                      )
    branch          = models.ForeignKey(
                        Branch,
                        on_delete=models.PROTECT,
                        related_name='sales'
                      )
    billed_by       = models.ForeignKey(
                        User,
                        on_delete=models.SET_NULL,
                        null=True,
                        related_name='bills_created'
                      )

    # ── Customer Info (optional) ──────────────────────────────────
    customer_name   = models.CharField(max_length=150, blank=True)
    customer_phone  = models.CharField(max_length=20, blank=True)
    table_number    = models.CharField(max_length=10, blank=True)

    # ── Financials (DENORMALIZED — frozen at time of sale) ────────
    subtotal        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_total       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total           = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # ── Status ────────────────────────────────────────────────────
    status          = models.CharField(
                        max_length=20,
                        choices=Status.choices,
                        default=Status.PENDING
                      )
    payment_method  = models.CharField(
                        max_length=20,
                        choices=PaymentMethod.choices,
                        blank=True
                      )

    # ── Member Credit Link (Phase 4 will use this) ────────────────
    member          = models.ForeignKey(
                        'members.Member',
                        on_delete=models.SET_NULL,
                        null=True,
                        blank=True,
                        related_name='sales'
                      )

    # ── Metadata ──────────────────────────────────────────────────
    notes           = models.TextField(blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    paid_at         = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            # WHY: Dashboard queries always filter by branch + date
            models.Index(fields=['branch', 'created_at'], name='idx_sale_branch_date'),
            # WHY: Status filter for open bills on POS screen
            models.Index(fields=['status'], name='idx_sale_status'),
            # WHY: Bill number lookups for reprinting
            models.Index(fields=['bill_number'], name='idx_sale_bill_number'),
        ]

    def __str__(self):
        return f"{self.bill_number} | ₹{self.total} | {self.status}"


class SaleItem(models.Model):
    """
    One line in a bill. Represents: "2 × Chicken Biryani @ ₹180 = ₹360"

    WHY we store unit_price here (not just reference MenuItem.base_price):
    Prices can change. This row is a RECEIPT — it records what was
    charged at the exact moment of purchase. Immutable after creation.
    
    WHY we store item_name separately:
    If a MenuItem is deleted/renamed in future, old bills must still
    show the original item name. This is a historical record.
    """
    sale        = models.ForeignKey(
                    Sale,
                    on_delete=models.CASCADE,
                    related_name='items'
                  )
    menu_item   = models.ForeignKey(
                    MenuItem,
                    on_delete=models.PROTECT,   # Can't delete item with billing history
                    related_name='sale_items'
                  )

    # ── Frozen at time of billing (immutable receipt data) ────────
    item_name   = models.CharField(max_length=200)   # Snapshot of name
    short_code  = models.CharField(max_length=10)    # Snapshot of PLU
    unit_price  = models.DecimalField(max_digits=8, decimal_places=2)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2)

    # ── Quantity and totals ───────────────────────────────────────
    quantity    = models.PositiveIntegerField(default=1)
    tax_amount  = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    line_total  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # line_total = (unit_price × quantity) + tax_amount

    class Meta:
        # One menu item appears once per sale (quantity field handles multiples)
        unique_together = ['sale', 'menu_item']

    def __str__(self):
        return f"{self.short_code} ×{self.quantity} = ₹{self.line_total}"


class Payment(models.Model):
    """
    WHY a separate Payment model:
    
    A customer may pay ₹500 in cash and ₹200 via UPI for a ₹700 bill.
    That's a SPLIT PAYMENT — two Payment rows for one Sale.
    
    Also: if payment fails and they try again, we need a record
    of each attempt. The Payment table is the audit trail.
    """
    sale            = models.ForeignKey(
                        Sale,
                        on_delete=models.PROTECT,
                        related_name='payments'
                      )
    method          = models.CharField(
                        max_length=20,
                        choices=Sale.PaymentMethod.choices
                      )
    amount          = models.DecimalField(max_digits=10, decimal_places=2)

    # For digital payments: store the transaction reference
    transaction_ref = models.CharField(max_length=100, blank=True)
    received_by     = models.ForeignKey(
                        User,
                        on_delete=models.SET_NULL,
                        null=True
                      )
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sale.bill_number} | {self.method} | ₹{self.amount}"