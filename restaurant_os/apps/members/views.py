from decimal import Decimal
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsOwnerOrManager, IsBillingStaff
from services.credit_service import CreditService
from services.sales_service import SalesService
from .models import Member, CreditLedger
from .serializers import (
    MemberSerializer, CreditLedgerSerializer,
    TopUpSerializer, CardLookupSerializer
)


class MemberListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/members/        → List all members
    POST /api/members/        → Register new member
    """
    serializer_class = MemberSerializer
    permission_classes = [IsBillingStaff]

    def get_queryset(self):
        qs = Member.objects.select_related('home_branch').filter(
            is_active=True
        )
        # Search by name or phone
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                models.Q(full_name__icontains=search) |
                models.Q(phone__icontains=search)
            )
        return qs


class MemberDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/members/<id>/  → Member profile + live balance
    PATCH /api/members/<id>/  → Update member details
    """
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [IsBillingStaff]


class CardLookupView(APIView):
    """
    POST /api/members/lookup/

    Called when billing staff scans a member card.
    Returns balance summary instantly.
    This is the Phase 4 equivalent of PLU lookup.
    """
    permission_classes = [IsBillingStaff]

    def post(self, request):
        serializer = CardLookupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            member = CreditService.get_member_by_card(
                serializer.validated_data['card_number']
            )
            summary = CreditService.get_balance_summary(member)
            return Response({'success': True, 'member': summary})
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )


class TopUpView(APIView):
    """
    POST /api/members/<id>/topup/

    Manager or Owner loads credit onto a member card.
    Creates a positive CreditLedger entry.
    """
    permission_classes = [IsOwnerOrManager]

    def post(self, request, pk):
        serializer = TopUpSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            member = Member.objects.get(id=pk, is_active=True)
        except Member.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Member not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        entry = CreditService.top_up(
            member      = member,
            amount      = serializer.validated_data['amount'],
            created_by  = request.user,
            description = serializer.validated_data.get('description', ''),
        )

        return Response({
            'success':         True,
            'message':         f"₹{entry.amount} added to {member.full_name}'s card.",
            'new_balance':     float(member.current_balance),
            'available_credit':float(member.available_credit),
            'entry':           CreditLedgerSerializer(entry).data,
        }, status=status.HTTP_201_CREATED)


class CreditPaymentView(APIView):
    """
    POST /api/billing/sales/<sale_id>/pay-credit/

    Pay a bill using member credit card.
    Atomically: PAID sale + DEBIT ledger entry.
    """
    permission_classes = [IsBillingStaff]

    def post(self, request, sale_id):
        card_number = request.data.get('card_number', '').upper().strip()
        if not card_number:
            return Response(
                {'success': False, 'error': 'card_number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            sale = SalesService.process_credit_payment(
                sale_id     = sale_id,
                member_card = card_number,
                received_by = request.user,
            )
            return Response({
                'success':     True,
                'message':     f'{sale.bill_number} paid via member credit.',
                'bill_number': sale.bill_number,
                'total':       float(sale.total),
                'member':      sale.member.full_name,
                'new_balance': float(sale.member.current_balance),
            })
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class MemberStatementView(APIView):
    """
    GET /api/members/<id>/statement/

    Returns the last 20 transactions for a member.
    Used for mini-statement on receipt and mobile app.
    """
    permission_classes = [IsBillingStaff]

    def get(self, request, pk):
        try:
            member = Member.objects.get(id=pk, is_active=True)
        except Member.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Member not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        limit     = int(request.query_params.get('limit', 20))
        statement = CreditService.get_statement(member, limit=limit)

        return Response({
            'success':         True,
            'card_number':     member.card_number,
            'full_name':       member.full_name,
            'current_balance': float(member.current_balance),
            'statement':       statement,
        })