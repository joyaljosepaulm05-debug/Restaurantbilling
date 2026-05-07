from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsOwnerOrManager, IsBillingStaff, IsSameBranch
from services.sales_service import SalesService
from .models import Sale
from services.receipt_service import ReceiptService
from .serializers import (
    SaleSerializer, CreateSaleSerializer, ProcessPaymentSerializer
)


class CreateSaleView(APIView):
    permission_classes = [IsBillingStaff]

    def post(self, request):
        serializer = CreateSaleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Fix: Handle Owner who has no assigned branch ──────────────
        branch = request.user.branch

        if branch is None:
            # Owner must specify which branch they're billing from
            branch_id = request.data.get('branch_id')
            if not branch_id:
                return Response(
                    {
                        'success': False,
                        'error': (
                            'You are an Owner with no assigned branch. '
                            'Please include "branch_id" in your request.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            from apps.accounts.models import Branch
            try:
                branch = Branch.objects.get(id=branch_id, is_active=True)
            except Branch.DoesNotExist:
                return Response(
                    {'success': False, 'error': f'Branch #{branch_id} not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        # ─────────────────────────────────────────────────────────────

        try:
            sale = SalesService.create_sale(
                branch        = branch,
                billed_by     = request.user,
                items_data    = serializer.validated_data['items'],
                customer_name = serializer.validated_data.get('customer_name', ''),
                table_number  = serializer.validated_data.get('table_number', ''),
                notes         = serializer.validated_data.get('notes', ''),
            )
            return Response(
                {'success': True, 'sale': SaleSerializer(sale).data},
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProcessPaymentView(APIView):
    """
    POST /api/billing/sales/<sale_id>/pay/
    
    Called when customer is ready to pay.
    Supports split payment (cash + UPI etc.)
    """
    permission_classes = [IsBillingStaff]

    def post(self, request, sale_id):
        serializer = ProcessPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            sale = SalesService.process_payment(
                sale_id      = sale_id,
                payments_data= serializer.validated_data['payments'],
                received_by  = request.user,
            )
            return Response(
                {
                    'success': True,
                    'message': f'{sale.bill_number} marked as PAID.',
                    'sale': SaleSerializer(sale).data,
                },
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class VoidSaleView(APIView):
    """
    POST /api/billing/sales/<sale_id>/void/
    
    Cancels a PENDING sale and restores stock.
    Only managers/owners can void.
    """
    permission_classes = [IsOwnerOrManager]

    def post(self, request, sale_id):
        try:
            sale = SalesService.void_sale(
                sale_id   = sale_id,
                voided_by = request.user
            )
            return Response(
                {
                    'success': True,
                    'message': f'{sale.bill_number} has been voided.',
                },
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class SaleDetailView(APIView):
    """
    GET /api/billing/sales/<sale_id>/
    
    Returns full sale detail with items and payments.
    Used for receipt display and reprint.
    """
    permission_classes = [IsBillingStaff]

    def get(self, request, sale_id):
        try:
            data = SalesService.get_sale_detail(sale_id)
            return Response({'success': True, 'sale': data})
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )


class SaleListView(generics.ListAPIView):
    """
    GET /api/billing/sales/
    
    Lists sales. Branch-filtered for non-owners.
    Supports ?status=PENDING and ?date=2026-04-23 filters.
    """
    serializer_class = SaleSerializer
    permission_classes = [IsBillingStaff]

    def get_queryset(self):
        user = self.request.user
        qs = Sale.objects.select_related(
            'branch', 'billed_by'
        ).prefetch_related('items', 'payments')

        # Branch isolation
        if not user.is_owner:
            qs = qs.filter(branch=user.branch)

        # Optional filters
        sale_status = self.request.query_params.get('status')
        date        = self.request.query_params.get('date')

        if sale_status:
            qs = qs.filter(status=sale_status.upper())
        if date:
            qs = qs.filter(created_at__date=date)

        return qs
class PrintReceiptView(APIView):
    """
    POST /api/billing/sales/<sale_id>/print/

    Prints a receipt to the thermal printer.
    Can also return a text preview if no printer connected.

    WHY allow reprint:
    Paper jams, power cuts, customer asks for duplicate.
    Any PAID bill can be reprinted any number of times.
    """
    permission_classes = [IsBillingStaff]

    def post(self, request, sale_id):
        try:
            # Get complete sale data
            sale_data = SalesService.get_sale_detail(sale_id)
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get printer config from request
        # Default: file mode (safe for development)
        connection_type = request.data.get('connection', 'file')
        preview_only    = request.data.get('preview_only', False)

        if preview_only:
            # Return text preview — no printer needed
            preview = ReceiptService.preview_receipt(sale_data)
            return Response({
                'success': True,
                'preview': preview,
                'bill_number': sale_data['bill_number'],
            })

        # Printer connection config
        printer_kwargs = {}
        if connection_type == 'network':
            printer_kwargs['host'] = request.data.get(
                'host', '192.168.1.100'
            )
            printer_kwargs['port'] = request.data.get('port', 9100)

        elif connection_type == 'file':
            printer_kwargs['filepath'] = request.data.get(
                'filepath', '/tmp/receipt.txt'
            )

        result = ReceiptService.print_receipt(
            sale_data       = sale_data,
            connection_type = connection_type,
            **printer_kwargs
        )

        status_code = (
            status.HTTP_200_OK
            if result['success']
            else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        return Response(result, status=status_code)