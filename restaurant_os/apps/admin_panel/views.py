from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import Coalesce
from django.utils import timezone
from decimal import Decimal
from datetime import date, timedelta
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.models import User, Branch
from apps.accounts.permissions import IsOwner, IsOwnerOrManager
from apps.billing.models import Sale
from .models import AdminAuditLog
from .serializers import (
    AdminUserListSerializer, AdminUserCreateSerializer,
    AdminUserUpdateSerializer, AdminBranchSerializer,
    AdminAuditLogSerializer, SalesByUserSerializer,
    generate_temp_password,
)


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_action(request, action_type, description,
               target_user=None, target_branch=None, metadata=None):
    """Helper — create an audit log entry."""
    AdminAuditLog.objects.create(
        performed_by  = request.user,
        action_type   = action_type,
        description   = description,
        target_user   = target_user,
        target_branch = target_branch,
        metadata      = metadata or {},
        ip_address    = get_client_ip(request),
    )


# ── User Management ──────────────────────────────────────────────

class AdminUserListCreateView(APIView):
    """
    GET  /api/admin/users/   → all staff with bill counts
    POST /api/admin/users/   → create new staff member
    """
    permission_classes = [IsOwner]

    def get(self, request):
        role   = request.query_params.get('role')
        branch = request.query_params.get('branch')
        search = request.query_params.get('search')

        qs = User.objects.select_related('branch').all()

        if role:
            qs = qs.filter(role=role.upper())
        if branch:
            qs = qs.filter(branch_id=branch)
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search)
            )

        serializer = AdminUserListSerializer(qs, many=True)
        return Response({
            'success': True,
            'count':   qs.count(),
            'users':   serializer.data,
        })

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        temp_pw = user.temp_password

        log_action(
            request,
            action_type   = AdminAuditLog.ActionType.USER_CREATED,
            description   = f"Created user {user.full_name} ({user.role})",
            target_user   = user,
            target_branch = user.branch,
            metadata      = {'role': user.role, 'email': user.email},
        )

        return Response({
            'success':       True,
            'user':          AdminUserListSerializer(user).data,
            'temp_password': temp_pw,
            'message':       (
                f"User created. Share this temporary password "
                f"with {user.full_name}: {temp_pw}"
            ),
        }, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    """
    GET   /api/admin/users/<id>/  → user detail
    PATCH /api/admin/users/<id>/  → edit role, branch, active
    """
    permission_classes = [IsOwner]

    def _get_user(self, pk):
        try:
            return User.objects.select_related('branch').get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AdminUserListSerializer(user)

        # Extra: recent bills by this user
        recent_sales = Sale.objects.filter(
            billed_by=user
        ).order_by('-created_at')[:10].values(
            'bill_number', 'total', 'status', 'created_at'
        )

        return Response({
            'success':     True,
            'user':        serializer.data,
            'recent_bills': list(recent_sales),
        })

    def patch(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        old_role   = user.role
        old_branch = user.branch
        old_active = user.is_active

        serializer = AdminUserUpdateSerializer(
            user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        user.refresh_from_db()

        # Determine what changed for the log
        changes = {}
        if old_role != user.role:
            changes['role'] = {'from': old_role, 'to': user.role}
        if old_active != user.is_active:
            changes['active'] = {'from': old_active, 'to': user.is_active}

        action = AdminAuditLog.ActionType.USER_UPDATED
        if not user.is_active and old_active:
            action = AdminAuditLog.ActionType.USER_DEACTIVATED
        elif user.is_active and not old_active:
            action = AdminAuditLog.ActionType.USER_ACTIVATED

        log_action(
            request,
            action_type   = action,
            description   = f"Updated user {user.full_name}",
            target_user   = user,
            target_branch = user.branch,
            metadata      = changes,
        )

        return Response({
            'success': True,
            'user':    AdminUserListSerializer(user).data,
        })


class AdminResetPasswordView(APIView):
    """POST /api/admin/users/<id>/reset-password/"""
    permission_classes = [IsOwner]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        temp_pw = generate_temp_password()
        user.set_password(temp_pw)
        user.save(update_fields=['password'])

        log_action(
            request,
            action_type = AdminAuditLog.ActionType.PASSWORD_RESET,
            description = f"Password reset for {user.full_name}",
            target_user = user,
            metadata    = {},
        )

        return Response({
            'success':       True,
            'temp_password': temp_pw,
            'message': (
                f"New temporary password for {user.full_name}: "
                f"{temp_pw}. Share this securely."
            ),
        })


# ── Branch Management ────────────────────────────────────────────

class AdminBranchListCreateView(APIView):
    """
    GET  /api/admin/branches/   → all branches with stats
    POST /api/admin/branches/   → create new branch
    """
    permission_classes = [IsOwner]

    def get(self, request):
        branches   = Branch.objects.all()
        serializer = AdminBranchSerializer(branches, many=True)
        return Response({
            'success':  True,
            'branches': serializer.data,
        })

    def post(self, request):
        serializer = AdminBranchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        branch = serializer.save()

        log_action(
            request,
            action_type   = AdminAuditLog.ActionType.BRANCH_CREATED,
            description   = f"Created branch: {branch.name}",
            target_branch = branch,
            metadata      = {'name': branch.name, 'address': branch.address},
        )

        return Response({
            'success': True,
            'branch':  AdminBranchSerializer(branch).data,
        }, status=status.HTTP_201_CREATED)


class AdminBranchDetailView(APIView):
    """
    GET   /api/admin/branches/<id>/  → branch detail + staff list
    PATCH /api/admin/branches/<id>/  → edit or toggle active
    """
    permission_classes = [IsOwner]

    def _get_branch(self, pk):
        try:
            return Branch.objects.get(pk=pk)
        except Branch.DoesNotExist:
            return None

    def get(self, request, pk):
        branch = self._get_branch(pk)
        if not branch:
            return Response(
                {'success': False, 'error': 'Branch not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        staff = User.objects.filter(
            branch=branch, is_active=True
        ).values('id', 'full_name', 'role', 'email')

        return Response({
            'success': True,
            'branch':  AdminBranchSerializer(branch).data,
            'staff':   list(staff),
        })

    def patch(self, request, pk):
        branch = self._get_branch(pk)
        if not branch:
            return Response(
                {'success': False, 'error': 'Branch not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        old_active = branch.is_active
        serializer = AdminBranchSerializer(
            branch, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        branch.refresh_from_db()

        action = AdminAuditLog.ActionType.BRANCH_UPDATED
        if old_active != branch.is_active:
            action = AdminAuditLog.ActionType.BRANCH_TOGGLED

        log_action(
            request,
            action_type   = action,
            description   = f"Updated branch: {branch.name}",
            target_branch = branch,
            metadata      = {'is_active': branch.is_active},
        )

        return Response({
            'success': True,
            'branch':  AdminBranchSerializer(branch).data,
        })


# ── Audit Log ────────────────────────────────────────────────────

class AdminAuditLogView(generics.ListAPIView):
    """
    GET /api/admin/audit-log/
    Combines AdminAuditLog + Sale events for a full picture.
    Filters: ?action_type= &branch= &user= &days=
    """
    serializer_class   = AdminAuditLogSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        qs = AdminAuditLog.objects.select_related(
            'performed_by', 'target_user', 'target_branch'
        )

        action = self.request.query_params.get('action_type')
        branch = self.request.query_params.get('branch')
        user   = self.request.query_params.get('user')
        days   = self.request.query_params.get('days', 7)

        since = timezone.now() - timedelta(days=int(days))
        qs    = qs.filter(created_at__gte=since)

        if action:
            qs = qs.filter(action_type=action)
        if branch:
            qs = qs.filter(target_branch_id=branch)
        if user:
            qs = qs.filter(performed_by_id=user)

        return qs


# ── Sales by User Report ─────────────────────────────────────────

class SalesByUserView(APIView):
    """
    GET /api/admin/sales-report/
    Shows billing performance per staff member.
    Filters: ?branch= &days= &date=
    """
    permission_classes = [IsOwner]

    def get(self, request):
        branch = request.query_params.get('branch')
        days   = int(request.query_params.get('days', 30))
        since  = timezone.now().date() - timedelta(days=days)

        qs = Sale.objects.filter(created_at__date__gte=since)
        if branch:
            qs = qs.filter(branch_id=branch)

        # Aggregate by billing staff member
        by_user = (
            qs
            .values(
                'billed_by__id',
                'billed_by__full_name',
                'billed_by__role',
                'billed_by__branch__name',
            )
            .annotate(
                total_bills   = Count('id', filter=Q(status=Sale.Status.PAID)),
                total_revenue = Coalesce(
                    Sum('total', filter=Q(status=Sale.Status.PAID)),
                    Decimal('0')
                ),
                total_voids   = Count('id', filter=Q(status=Sale.Status.VOID)),
                avg_bill      = Coalesce(
                    Avg('total', filter=Q(status=Sale.Status.PAID)),
                    Decimal('0')
                ),
            )
            .order_by('-total_revenue')
        )

        report = [
            {
                'user_id':       r['billed_by__id'],
                'full_name':     r['billed_by__full_name'] or 'Unknown',
                'role':          r['billed_by__role'] or '—',
                'branch_name':   r['billed_by__branch__name'] or 'All',
                'total_bills':   r['total_bills'],
                'total_revenue': float(r['total_revenue']),
                'total_voids':   r['total_voids'],
                'avg_bill':      round(float(r['avg_bill']), 2),
            }
            for r in by_user
            if r['billed_by__id'] is not None
        ]

        return Response({
            'success': True,
            'period':  f"Last {days} days",
            'report':  report,
        })


# ── Permission Reference ─────────────────────────────────────────

class PermissionReferenceView(APIView):
    """
    GET /api/admin/permissions/
    Returns a static reference of what each role can do.
    Read-only — permissions are code-enforced, not DB-stored.
    """
    permission_classes = [IsOwner]

    def get(self, request):
        return Response({
            'success': True,
            'roles': {
                'OWNER': {
                    'description': 'Full access to everything',
                    'can': [
                        'Create/edit/deactivate any user',
                        'Create/edit all branches',
                        'View all branches data',
                        'View audit log',
                        'View analytics',
                        'Create/void sales on any branch',
                        'Top-up member credit',
                    ],
                },
                'MANAGER': {
                    'description': 'Full control of own branch',
                    'can': [
                        'Create/void sales at own branch',
                        'Add stock at own branch',
                        'Add/edit menu items',
                        'Register staff faces',
                        'Top-up member credit',
                        'View own branch audit (read-only)',
                    ],
                    'cannot': [
                        'Create users',
                        'Create branches',
                        'View other branches',
                        'View analytics',
                    ],
                },
                'BILLING': {
                    'description': 'Billing only at own branch',
                    'can': [
                        'Create sales',
                        'Process payments',
                        'Create members',
                        'Print receipts',
                        'Lookup PLU codes',
                    ],
                    'cannot': [
                        'Void sales',
                        'Add stock',
                        'Edit menu items',
                        'View analytics',
                        'Create users',
                    ],
                },
                'INVENTORY': {
                    'description': 'Stock management only',
                    'can': [
                        'Add stock',
                        'View menu items',
                        'View stock levels',
                    ],
                    'cannot': [
                        'Create sales',
                        'Process payments',
                        'Edit menu items',
                        'View member data',
                        'View analytics',
                    ],
                },
            },
        })