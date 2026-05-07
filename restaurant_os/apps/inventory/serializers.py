from rest_framework import serializers
from .models import Category, MenuItem, BranchMenuItem, StockLog


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(
        source='items.count',
        read_only=True
    )

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description',
            'sort_order', 'icon', 'is_active', 'item_count'
        ]


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )
    # short_code is auto-uppercased before saving
    short_code = serializers.CharField(max_length=10)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_name',
            'name', 'short_code', 'item_type',
            'base_price', 'tax_percent',
            'is_available', 'is_active',
            'description', 'preparation_time', 'tags',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_short_code(self, value):
        """Auto-uppercase the PLU code before saving."""
        return value.upper().strip()

    def validate_base_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Price must be greater than zero."
            )
        return value


class PLULookupSerializer(serializers.Serializer):
    """
    The billing screen sends just the short_code.
    This serializer validates and cleans it.
    """
    short_code = serializers.CharField(max_length=10)

    def validate_short_code(self, value):
        return value.upper().strip()


class StockLogSerializer(serializers.ModelSerializer):
    item_name   = serializers.CharField(
                    source='menu_item.name', read_only=True)
    item_code   = serializers.CharField(
                    source='menu_item.short_code', read_only=True)
    created_by_name = serializers.CharField(
                    source='created_by.full_name', read_only=True)

    class Meta:
        model = StockLog
        fields = [
            'id', 'menu_item', 'item_name', 'item_code',
            'branch', 'quantity', 'action',
            'note', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_at', 'created_by']