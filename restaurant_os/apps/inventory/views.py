from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsOwnerOrManager, IsBillingStaff
from services.inventory_service import InventoryService
from .models import Category, MenuItem, StockLog
from .serializers import (
    CategorySerializer, MenuItemSerializer,
    PLULookupSerializer, StockLogSerializer
)


# ── Category Views ──────────────────────────────────────────────────────────

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsOwnerOrManager]


# ── Menu Item Views ─────────────────────────────────────────────────────────

class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [IsOwnerOrManager]

    def get_queryset(self):
        qs = MenuItem.objects.select_related('category').filter(is_active=True)
        # Optional filter: ?category=1 or ?available=true
        category = self.request.query_params.get('category')
        available = self.request.query_params.get('available')
        if category:
            qs = qs.filter(category_id=category)
        if available == 'true':
            qs = qs.filter(is_available=True)
        return qs


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsOwnerOrManager]

    def destroy(self, request, *args, **kwargs):
        """
        WHY we override destroy:
        We never hard-delete menu items — they may exist in old bills.
        We soft-delete by setting is_active=False.
        """
        item = self.get_object()
        item.is_active = False
        item.save()
        return Response(
            {'detail': f'"{item.name}" has been deactivated.'},
            status=status.HTTP_200_OK
        )


# ── PLU Lookup — THE SPEED-CRITICAL ENDPOINT ────────────────────────────────

class PLULookupView(APIView):
    """
    GET /api/inventory/plu/<short_code>/
    
    Called on EVERY keypress from the billing screen.
    Must respond in < 100ms.
    
    Accessible by Billing Staff (not just managers).
    """
    permission_classes = [IsBillingStaff]

    def get(self, request, short_code):
        result = InventoryService.lookup_by_plu(
            short_code=short_code,
            branch=request.user.branch
        )

        if not result:
            return Response(
                {'detail': f'No item found for code "{short_code.upper()}"'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(result, status=status.HTTP_200_OK)


# ── Full Menu for Billing Screen ─────────────────────────────────────────────

class BillingMenuView(APIView):
    """
    GET /api/inventory/menu/
    
    Loads the entire menu grouped by category.
    Called ONCE when the billing screen opens.
    Branch-aware pricing included.
    """
    permission_classes = [IsBillingStaff]

    def get(self, request):
        menu = InventoryService.get_menu_for_branch(
            branch=request.user.branch
        )
        return Response({
            'branch': request.user.branch.name if request.user.branch else 'All',
            'menu': menu
        })


# ── Stock Management ─────────────────────────────────────────────────────────

class StockAddView(APIView):
    """
    POST /api/inventory/stock/add/
    Used by Inventory Staff to log new stock arriving.
    """
    permission_classes = [IsOwnerOrManager]

    def post(self, request):
        item_id  = request.data.get('menu_item_id')
        quantity = request.data.get('quantity')
        note     = request.data.get('note', '')

        if not item_id or not quantity:
            return Response(
                {'detail': 'menu_item_id and quantity are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            item = MenuItem.objects.get(id=item_id)
            log = InventoryService.add_stock(
                menu_item=item,
                branch=request.user.branch,
                quantity=int(quantity),
                user=request.user,
                note=note
            )
            return Response(
                StockLogSerializer(log).data,
                status=status.HTTP_201_CREATED
            )
        except MenuItem.DoesNotExist:
            return Response(
                {'detail': 'Menu item not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class StockLevelView(APIView):
    """
    GET /api/inventory/stock/<item_id>/
    Returns current stock level for an item at the user's branch.
    """
    permission_classes = [IsBillingStaff]

    def get(self, request, item_id):
        branch = request.user.branch
        level = InventoryService.get_stock_level(
            menu_item_id=item_id,
            branch_id=branch.id if branch else None
        )
        return Response({
            'menu_item_id': item_id,
            'branch':       branch.name if branch else 'All',
            'stock_level':  level
        })