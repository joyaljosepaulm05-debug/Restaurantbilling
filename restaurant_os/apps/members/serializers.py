from rest_framework import serializers
from .models import Member, CreditLedger


class MemberSerializer(serializers.ModelSerializer):
    current_balance  = serializers.DecimalField(
                         max_digits=10, decimal_places=2,
                         read_only=True
                       )
    available_credit = serializers.DecimalField(
                         max_digits=10, decimal_places=2,
                         read_only=True
                       )
    home_branch_name = serializers.CharField(
                         source='home_branch.name',
                         read_only=True, default=''
                       )

    class Meta:
        model = Member
        fields = [
            'id', 'card_number', 'full_name', 'phone', 'email',
            'tier', 'credit_limit', 'home_branch', 'home_branch_name',
            'is_active', 'joined_at',
            'current_balance', 'available_credit',
        ]
        read_only_fields = ['card_number', 'joined_at']

    def validate_phone(self, value):
        return value.strip()


class CreditLedgerSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
                    source='member.full_name', read_only=True)
    bill_number = serializers.CharField(
                    source='sale.bill_number',
                    read_only=True, default=None)

    class Meta:
        model = CreditLedger
        fields = [
            'id', 'member', 'member_name',
            'amount', 'entry_type', 'description',
            'bill_number', 'created_at'
        ]
        read_only_fields = ['created_at']


class TopUpSerializer(serializers.Serializer):
    amount      = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(
                    max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Top-up amount must be greater than zero."
            )
        return value


class CardLookupSerializer(serializers.Serializer):
    """Used by billing screen when customer presents card."""
    card_number = serializers.CharField(max_length=20)

    def validate_card_number(self, value):
        return value.upper().strip()