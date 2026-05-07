from django.db.models import Sum, Q
from django.core.cache import cache
from apps.inventory.models import MenuItem, StockLog


class InventoryService:
    """
    All inventory business logic lives here.
    Views just call these methods — they don't think.
    """

    @staticmethod
    def lookup_by_plu(short_code: str, branch=None) -> dict:
        """
        THE core PLU lookup. Called on every keypress in billing.
        Must be under 100ms. This is why we have db_index=True.

        Returns a ready-to-use dict for the billing screen.
        """
        short_code = short_code.upper().strip()

        try:
            item = (
                MenuItem.objects
                .select_related('category')      # JOIN in one query
                .prefetch_related('branch_prices')
                .get(
                    short_code=short_code,
                    is_active=True,
                    is_available=True
                )
            )
        except MenuItem.DoesNotExist:
            return None

        # Get the correct price for this branch
        price = item.get_price_for_branch(branch) if branch else item.base_price

        # Calculate tax amount
        tax_amount = (price * item.tax_percent / 100).quantize(
            __import__('decimal').Decimal('0.01')
        )

        return {
            'id':           item.id,
            'short_code':   item.short_code,
            'name':         item.name,
            'category':     item.category.name,
            'price':        float(price),
            'tax_percent':  float(item.tax_percent),
            'tax_amount':   float(tax_amount),
            'total':        float(price + tax_amount),
            'tags':         item.tags,
            'prep_time':    item.preparation_time,
        }

    @staticmethod
    def get_stock_level(menu_item_id: int, branch_id: int) -> int:
        """
        WHY aggregate here and not store a counter:
        Aggregating the log gives us a live, audit-proof stock number.
        SUM of all +/- entries = current stock. Always accurate.
        """
        result = StockLog.objects.filter(
            menu_item_id=menu_item_id,
            branch_id=branch_id
        ).aggregate(total=Sum('quantity'))

        return result['total'] or 0

    @staticmethod
    def add_stock(menu_item, branch, quantity, user, note=''):
        """Records a stock addition. Always positive quantity."""
        if quantity <= 0:
            raise ValueError("Stock addition quantity must be positive.")

        return StockLog.objects.create(
            menu_item=menu_item,
            branch=branch,
            quantity=quantity,
            action=StockLog.ActionType.RESTOCK,
            created_by=user,
            note=note
        )

    @staticmethod
    def deduct_stock(menu_item, branch, quantity, user, action=None):
        """
        Called automatically by SalesService in Phase 3.
        Records a negative quantity entry.
        """
        if quantity <= 0:
            raise ValueError("Deduction quantity must be positive.")

        action = action or StockLog.ActionType.SALE

        return StockLog.objects.create(
            menu_item=menu_item,
            branch=branch,
            quantity=-quantity,   # ← Negative = reduction
            action=action,
            created_by=user
        )

    @staticmethod
    def get_menu_for_branch(branch):
        """
        Returns the full menu grouped by category.
        Used by the billing screen on startup to load all items.
        """
        items = (
            MenuItem.objects
            .filter(is_active=True, is_available=True)
            .select_related('category')
            .prefetch_related('branch_prices')
            .order_by('category__sort_order', 'short_code')
        )

        # Group by category
        menu = {}
        for item in items:
            cat = item.category.name
            if cat not in menu:
                menu[cat] = []
            menu[cat].append({
                'id':         item.id,
                'short_code': item.short_code,
                'name':       item.name,
                'price':      float(item.get_price_for_branch(branch)),
                'tags':       item.tags,
            })

        return menu