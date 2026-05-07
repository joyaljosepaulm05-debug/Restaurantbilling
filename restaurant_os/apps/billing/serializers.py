from rest_framework import serializers
from .models import Sale, SaleItem, Payment


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = [
            'id', 'short_code', 'item_name',
            'quantity', 'unit_price', 'tax_amount', 'line_total'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'method', 'amount', 'transaction_ref', 'created_at']


class SaleSerializer(serializers.ModelSerializer):
    items    = SaleItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    billed_by_name = serializers.CharField(
        source='billed_by.full_name', read_only=True
    )
    branch_name = serializers.CharField(
        source='branch.name', read_only=True
    )

    class Meta:
        model = Sale
        fields = [
            'id', 'bill_number', 'branch', 'branch_name',
            'billed_by', 'billed_by_name',
            'customer_name', 'table_number',
            'subtotal', 'tax_total', 'discount_amount', 'total',
            'status', 'payment_method',
            'notes', 'created_at', 'paid_at',
            'items', 'payments',
        ]
        read_only_fields = [
            'bill_number', 'subtotal', 'tax_total',
            'total', 'created_at', 'paid_at'
        ]


class CreateSaleSerializer(serializers.Serializer):
    """
    WHY a separate serializer for creation:
    Creating a sale needs raw input (short_codes + quantities).
    Reading a sale returns the full nested structure.
    These are different shapes — two serializers is cleaner.
    """
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        error_messages={'min_length': 'A sale must have at least one item.'}
    )
    customer_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    table_number  = serializers.CharField(max_length=10,  required=False, allow_blank=True)
    notes         = serializers.CharField(required=False, allow_blank=True)

    def validate_items(self, value):
        for item in value:
            if 'short_code' not in item:
                raise serializers.ValidationError(
                    "Each item must have a 'short_code'."
                )
            if 'quantity' not in item:
                raise serializers.ValidationError(
                    "Each item must have a 'quantity'."
                )
            try:
                qty = int(item['quantity'])
                if qty <= 0:
                    raise serializers.ValidationError(
                        f"Quantity for {item['short_code']} must be positive."
                    )
            except (ValueError, TypeError):
                raise serializers.ValidationError("Quantity must be a number.")
        return value


class ProcessPaymentSerializer(serializers.Serializer):
    payments = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )

    def validate_payments(self, value):
        valid_methods = [m[0] for m in Sale.PaymentMethod.choices]
        for p in value:
            if 'method' not in p or p['method'] not in valid_methods:
                raise serializers.ValidationError(
                    f"Each payment needs a valid 'method': {valid_methods}"
                )
            if 'amount' not in p:
                raise serializers.ValidationError(
                    "Each payment needs an 'amount'."
                )
            try:
                amt = float(p['amount'])
                if amt <= 0:
                    raise serializers.ValidationError("Amount must be positive.")
            except (ValueError, TypeError):
                raise serializers.ValidationError("Amount must be a number.")
        return value