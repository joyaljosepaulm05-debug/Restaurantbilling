from django.db import models
from apps.accounts.models import Branch


class Category(models.Model):
    """
    WHY: Groups menu items for the billing screen UI.
    A billing staff presses Tab to cycle through categories,
    then types a PLU code within that category.
    
    Branch-aware: A branch can have its own category ordering.
    """
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Display order on POS screen (1 = show first)
    sort_order  = models.PositiveIntegerField(default=0)
    
    is_active   = models.BooleanField(default=True)
    
    # WHY: Emoji makes it visually scannable on the billing screen
    icon        = models.CharField(max_length=10, blank=True)  

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.icon} {self.name}".strip()


class MenuItem(models.Model):
    """
    The core of the PLU system.
    
    Design Decisions:
    
    1. short_code: The PLU. 'CB1', 'TEA', 'PR1' etc.
       - UNIQUE + db_index=True = O(log n) lookup, always < 1ms
       - Max 10 chars: staff memorize these codes
       
    2. base_price: The DEFAULT price across all branches.
       BranchMenuItem overrides this per branch.
       
    3. is_available: Toggles item OFF for the day without deleting.
       E.g., "We're out of Fish today" — flip is_available=False.
       
    4. preparation_time: Used in Phase 7 analytics to flag 
       slow items affecting table turnover.
    """
    
    class ItemType(models.TextChoices):
        FOOD      = 'FOOD',      'Food'
        BEVERAGE  = 'BEVERAGE',  'Beverage'
        COMBO     = 'COMBO',     'Combo Meal'
        ADD_ON    = 'ADD_ON',    'Add-on / Extra'

    # ── Core Identity ────────────────────────────────────────────
    category    = models.ForeignKey(
                    Category,
                    on_delete=models.PROTECT,  # Can't delete category with items
                    related_name='items'
                  )
    name        = models.CharField(max_length=200)
    
    # THE KEY FIELD — This is the PLU code
    short_code  = models.CharField(
                    max_length=10,
                    unique=True,
                    db_index=True,    # B-Tree index for < 1ms lookup
                    help_text="Short billing code e.g. 'CB1', 'TEA', 'PR2'"
                  )
    
    item_type   = models.CharField(
                    max_length=20,
                    choices=ItemType.choices,
                    default=ItemType.FOOD
                  )
    
    # ── Pricing ──────────────────────────────────────────────────
    base_price  = models.DecimalField(
                    max_digits=8,
                    decimal_places=2,
                    help_text="Default price. Override per branch via BranchMenuItem."
                  )
    
    # WHY DecimalField not FloatField:
    # FloatField: 180.0 might store as 179.9999999 (floating point error)
    # DecimalField: 180.00 is EXACTLY 180.00. Always. Critical for billing.
    
    # ── Tax ──────────────────────────────────────────────────────
    tax_percent = models.DecimalField(
                    max_digits=5,
                    decimal_places=2,
                    default=5.00,
                    help_text="GST percentage e.g. 5.00 or 18.00"
                  )
    
    # ── Availability ─────────────────────────────────────────────
    is_available    = models.BooleanField(default=True)
    is_active       = models.BooleanField(default=True)  # Soft delete
    
    # ── Details ──────────────────────────────────────────────────
    description         = models.TextField(blank=True)
    preparation_time    = models.PositiveIntegerField(
                            default=5,
                            help_text="Estimated prep time in minutes"
                          )
    
    # WHY JSONB for allergens/tags:
    # These are flexible labels — ["veg", "spicy", "gluten-free"]
    # No need for a whole separate table. JSONB queries are fast.
    tags        = models.JSONField(
                    default=list,
                    blank=True,
                    help_text='e.g. ["veg", "spicy", "bestseller"]'
                  )
    
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'short_code']
        indexes = [
            # Composite index: category + availability
            # WHY: Billing screen always queries:
            # "Give me all AVAILABLE items in category X"
            models.Index(
                fields=['category', 'is_available'],
                name='idx_item_cat_available'
            ),
            # Full-text search fallback (when staff don't know the PLU)
            models.Index(
                fields=['name'],
                name='idx_item_name'
            ),
        ]

    def __str__(self):
        return f"[{self.short_code}] {self.name} — ₹{self.base_price}"
    
    def get_price_for_branch(self, branch):
        """
        Returns the correct price for a specific branch.
        Falls back to base_price if no override exists.
        
        Usage in billing: item.get_price_for_branch(request.user.branch)
        """
        try:
            override = self.branch_prices.get(branch=branch, is_active=True)
            return override.price
        except BranchMenuItem.DoesNotExist:
            return self.base_price


class BranchMenuItem(models.Model):
    """
    WHY this table exists:
    
    Branch Thrissur sells Tea for ₹15.
    Branch Kochi sells Tea for ₹20 (higher rent, higher price).
    
    Instead of duplicating the entire MenuItem, we store ONLY the
    price difference here. The MenuItem stays as single source of truth.
    
    This is the "Override Pattern" — common in commercial POS systems.
    """
    branch      = models.ForeignKey(
                    Branch,
                    on_delete=models.CASCADE,
                    related_name='menu_overrides'
                  )
    menu_item   = models.ForeignKey(
                    MenuItem,
                    on_delete=models.CASCADE,
                    related_name='branch_prices'
                  )
    price       = models.DecimalField(max_digits=8, decimal_places=2)
    is_active   = models.BooleanField(default=True)

    class Meta:
        # One price override per item per branch — no duplicates
        unique_together = ['branch', 'menu_item']

    def __str__(self):
        return f"{self.branch.name} | {self.menu_item.short_code} → ₹{self.price}"


class StockLog(models.Model):
    """
    WHY a log instead of just a counter:
    
    If you store stock as just a number (stock=45), you can change it
    to anything. There's no history. If it hits 0, you don't know why.
    
    A LOG means every change is a new row:
    Row 1: +100  (morning delivery arrived)
    Row 2: -3    (3 Biryanis sold)
    Row 3: -1    (1 wasted/spoiled)
    
    Current stock = SUM of all entries for that item at that branch.
    This is the LEDGER PATTERN — same as your bank account.
    You'll see this exact pattern again in Phase 4 (Credit Ledger).
    """
    
    class ActionType(models.TextChoices):
        RESTOCK  = 'RESTOCK',  'Stock Added'
        SALE     = 'SALE',     'Sold (Auto)'
        WASTE    = 'WASTE',    'Wasted / Spoiled'
        ADJUST   = 'ADJUST',   'Manual Adjustment'
        TRANSFER = 'TRANSFER', 'Branch Transfer'

    menu_item   = models.ForeignKey(
                    MenuItem,
                    on_delete=models.PROTECT,
                    related_name='stock_logs'
                  )
    branch      = models.ForeignKey(
                    Branch,
                    on_delete=models.PROTECT,
                    related_name='stock_logs'
                  )
    
    # Positive = stock added, Negative = stock removed
    quantity    = models.IntegerField(
                    help_text="Use negative for reductions e.g. -3"
                  )
    action      = models.CharField(max_length=20, choices=ActionType.choices)
    note        = models.TextField(blank=True)
    
    # Who made this entry (audit trail)
    created_by  = models.ForeignKey(
                    'accounts.User',
                    on_delete=models.SET_NULL,
                    null=True
                  )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(
                fields=['menu_item', 'branch'],
                name='idx_stock_item_branch'
            ),
        ]

    def __str__(self):
        sign = '+' if self.quantity > 0 else ''
        return f"{self.menu_item.short_code} | {sign}{self.quantity} | {self.action}"