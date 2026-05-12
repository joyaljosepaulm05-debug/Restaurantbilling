from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from apps.accounts.models import User, Branch
from apps.billing.models import Sale
from .models import AdminAuditLog
import secrets
import string


def generate_temp_password(length=12) -> str:
    """Generates a readable temporary password."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight — for the user table."""
    branch_name = serializers.CharField(
        source='branch.name', read_only=True, default='All Branches'
    )
    bills_count = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'full_name', 'phone',
            'role', 'branch', 'branch_name',
            'is_active', 'date_joined',
            'bills_count',
        ]

    def get_bills_count(self, obj):
        return Sale.objects.filter(
            billed_by=obj,
            status=Sale.Status.PAID
        ).count()


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Used when Owner creates a new staff member."""
    temp_password = serializers.CharField(read_only=True)

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'full_name', 'phone',
            'role', 'branch', 'is_active', 'temp_password'
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'A user with this email already exists.'
            )
        return value.lower().strip()

    def create(self, validated_data):
        temp_pw = generate_temp_password()
        user = User.objects.create_user(
            email    = validated_data['email'],
            password = temp_pw,
            full_name= validated_data.get('full_name', ''),
            phone    = validated_data.get('phone', ''),
            role     = validated_data.get('role', 'BILLING'),
            branch   = validated_data.get('branch'),
        )
        # Return the plain password once — never stored again
        user.temp_password = temp_pw
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['full_name', 'phone', 'role', 'branch', 'is_active']


class AdminBranchSerializer(serializers.ModelSerializer):
    staff_count   = serializers.SerializerMethodField()
    manager_name  = serializers.SerializerMethodField()
    today_revenue = serializers.SerializerMethodField()

    class Meta:
        model  = Branch
        fields = [
            'id', 'name', 'address', 'phone',
            'is_active', 'created_at',
            'staff_count', 'manager_name', 'today_revenue',
        ]
        read_only_fields = ['created_at']

    def get_staff_count(self, obj):
        return User.objects.filter(branch=obj, is_active=True).count()

    def get_manager_name(self, obj):
        mgr = User.objects.filter(
            branch=obj, role='MANAGER', is_active=True
        ).first()
        return mgr.full_name if mgr else '—'

    def get_today_revenue(self, obj):
        from django.utils import timezone
        from django.db.models import Sum
        from django.db.models.functions import Coalesce
        from decimal import Decimal
        today = timezone.now().date()
        result = Sale.objects.filter(
            branch=obj,
            status=Sale.Status.PAID,
            created_at__date=today
        ).aggregate(
            rev=Coalesce(Sum('total'), Decimal('0'))
        )
        return float(result['rev'])


class AdminAuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(
        source='performed_by.full_name', read_only=True, default='—'
    )
    target_user_name  = serializers.CharField(
        source='target_user.full_name', read_only=True, default=None
    )
    target_branch_name = serializers.CharField(
        source='target_branch.name', read_only=True, default=None
    )

    class Meta:
        model  = AdminAuditLog
        fields = [
            'id', 'performed_by', 'performed_by_name',
            'action_type', 'description',
            'target_user', 'target_user_name',
            'target_branch', 'target_branch_name',
            'metadata', 'ip_address', 'created_at',
        ]


class SalesByUserSerializer(serializers.Serializer):
    """Sales performance per billing staff member."""
    user_id       = serializers.IntegerField()
    full_name     = serializers.CharField()
    role          = serializers.CharField()
    branch_name   = serializers.CharField()
    total_bills   = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    total_voids   = serializers.IntegerField()
    avg_bill      = serializers.FloatField()