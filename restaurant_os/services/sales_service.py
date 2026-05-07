from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from apps.billing.models import Sale, SaleItem, Payment
from apps.inventory.models import MenuItem
from services.inventory_service import InventoryService
from services.credit_service import CreditService

class SalesService:
    """
    The complete billing engine.
    
    All sale creation logic lives here. Nothing else touches this logic.
    Views call this service. Mobile API calls this service.
    Future webhook integrations call this service.
    One place. One truth.
    """

    @staticmethod
    def create_sale(branch, billed_by, items_data: list, 
                    customer_name='', table_number='', notes='') -> Sale:
        """
        Creates a PENDING sale with all line items.
        Does NOT process payment yet — that's a separate step.
        
        items_data format:
        [
            {'short_code': 'CB1', 'quantity': 2},
            {'short_code': 'TEA', 'quantity': 3},
        ]
        
        WHY two steps (create then pay):
        In a real restaurant, the order is taken first.
        Payment happens when the customer finishes eating — minutes later.
        The PENDING sale sits open while they eat.
        """

        # ── Step 1: Validate all items BEFORE touching the DB ────────────
        # If item 3 of 5 doesn't exist, we want to know BEFORE creating anything.
        resolved_items = []

        for item_data in items_data:
            short_code = item_data.get('short_code', '').upper().strip()
            quantity   = int(item_data.get('quantity', 1))

            if quantity <= 0:
                raise ValueError(f"Quantity for {short_code} must be positive.")

            # Use InventoryService for lookup (reuses our indexed PLU query)
            item_info = InventoryService.lookup_by_plu(short_code, branch)

            if not item_info:
                raise ValueError(
                    f"Item '{short_code}' not found or unavailable. "
                    f"Check the PLU code."
                )

            resolved_items.append({
                'menu_item_id': item_info['id'],
                'item_name':    item_info['name'],
                'short_code':   item_info['short_code'],
                'unit_price':   Decimal(str(item_info['price'])),
                'tax_percent':  Decimal(str(item_info['tax_percent'])),
                'quantity':     quantity,
            })

        # ── Step 2: Calculate totals ──────────────────────────────────────
        subtotal    = Decimal('0')
        tax_total   = Decimal('0')

        for item in resolved_items:
            line_pretax  = item['unit_price'] * item['quantity']
            line_tax     = (line_pretax * item['tax_percent'] / 100).quantize(
                              Decimal('0.01'), rounding=ROUND_HALF_UP
                           )
            line_total   = line_pretax + line_tax

            item['tax_amount']  = line_tax
            item['line_total']  = line_total

            subtotal  += line_pretax
            tax_total += line_tax

        grand_total = subtotal + tax_total

        # ── Step 3: Write to DB — ALL OR NOTHING ─────────────────────────
        # This is the critical section. If anything fails inside this block,
        # PostgreSQL rolls back ALL changes. No partial writes. Ever.
        with transaction.atomic():

            # Create the master Sale record
            sale = Sale.objects.create(
                branch          = branch,
                billed_by       = billed_by,
                customer_name   = customer_name,
                table_number    = table_number,
                subtotal        = subtotal,
                tax_total       = tax_total,
                total           = grand_total,
                status          = Sale.Status.PENDING,
                notes           = notes,
            )

            # Create one SaleItem per line
            sale_items = [
                SaleItem(
                    sale        = sale,
                    menu_item_id= item['menu_item_id'],
                    item_name   = item['item_name'],
                    short_code  = item['short_code'],
                    unit_price  = item['unit_price'],
                    tax_percent = item['tax_percent'],
                    quantity    = item['quantity'],
                    tax_amount  = item['tax_amount'],
                    line_total  = item['line_total'],
                )
                for item in resolved_items
            ]
            # bulk_create: ONE SQL INSERT for all items (not N inserts)
            # WHY: 10 items = 10 round trips vs 1 round trip. 10× faster.
            SaleItem.objects.bulk_create(sale_items)

            # Deduct stock for each item INSIDE the same transaction
            # If stock deduction fails → sale also rolls back. Clean.
            for item in resolved_items:
                menu_item = MenuItem.objects.get(id=item['menu_item_id'])
                InventoryService.deduct_stock(
                    menu_item = menu_item,
                    branch    = branch,
                    quantity  = item['quantity'],
                    user      = billed_by,
                    action    = 'SALE'
                )

        return sale   # Returns the saved Sale object

    @staticmethod
    def process_credit_payment(sale_id: int, member_card: str,
                                received_by) -> Sale:
        """
        Pays a bill entirely using member credit.
        Atomically: marks sale PAID + creates ledger debit.
        Both happen together or neither happens.
        """
        try:
            sale = Sale.objects.get(id=sale_id)
        except Sale.DoesNotExist:
            raise ValueError(f"Sale #{sale_id} not found.")

        if sale.status != Sale.Status.PENDING:
            raise ValueError(
                f"Sale {sale.bill_number} is already {sale.status}."
            )

        # Get member and validate credit
        member = CreditService.get_member_by_card(member_card)
        available = member.available_credit

        if available < sale.total:
            raise ValueError(
                f"Insufficient credit for {member.full_name}. "
                f"Available: ₹{available:.2f}, "
                f"Bill total: ₹{sale.total:.2f}."
            )

        # ── Atomic: pay bill + debit ledger together ─────────────
        with transaction.atomic():

            # Link member to this sale
            sale.member         = member
            sale.status         = Sale.Status.PAID
            sale.payment_method = Sale.PaymentMethod.CREDIT
            sale.paid_at        = timezone.now()
            sale.save(update_fields=[
                'member', 'status', 'payment_method', 'paid_at'
            ])

            # Create the ledger debit
            CreditService.debit_for_sale(
                member     = member,
                sale       = sale,
                amount     = sale.total,
                created_by = received_by,
            )

            # Also create a Payment record for consistency
            Payment.objects.create(
                sale        = sale,
                method      = Sale.PaymentMethod.CREDIT,
                amount      = sale.total,
                received_by = received_by,
            )

        return sale
    @staticmethod
    def process_payment(sale_id: int, payments_data: list, 
                        received_by) -> Sale:
        """
        Marks a PENDING sale as PAID and records payment details.
        
        payments_data format:
        [
            {'method': 'CASH', 'amount': 500, 'transaction_ref': ''},
            {'method': 'UPI',  'amount': 200, 'transaction_ref': 'UPI123456'},
        ]
        
        WHY validate total before marking paid:
        The sum of payments must equal the sale total.
        Prevents accidentally closing a bill with insufficient payment.
        """

        try:
            sale = Sale.objects.get(id=sale_id)
        except Sale.DoesNotExist:
            raise ValueError(f"Sale #{sale_id} not found.")

        if sale.status != Sale.Status.PENDING:
            raise ValueError(
                f"Sale {sale.bill_number} is already {sale.status}. "
                f"Cannot process payment."
            )

        # ── Validate payment total ────────────────────────────────────────
        total_paid = sum(
            Decimal(str(p['amount'])) for p in payments_data
        )

        if total_paid < sale.total:
            raise ValueError(
                f"Payment of ₹{total_paid} is less than bill total ₹{sale.total}. "
                f"Remaining: ₹{sale.total - total_paid}"
            )

        # ── Determine summary payment method ─────────────────────────────
        methods_used = [p['method'] for p in payments_data]
        if len(methods_used) == 1:
            summary_method = methods_used[0]
        else:
            summary_method = Sale.PaymentMethod.SPLIT

        # ── Write payment atomically ──────────────────────────────────────
        with transaction.atomic():

            # Create Payment records
            payment_records = [
                Payment(
                    sale            = sale,
                    method          = p['method'],
                    amount          = Decimal(str(p['amount'])),
                    transaction_ref = p.get('transaction_ref', ''),
                    received_by     = received_by,
                )
                for p in payments_data
            ]
            Payment.objects.bulk_create(payment_records)

            # Mark sale as PAID
            sale.status         = Sale.Status.PAID
            sale.payment_method = summary_method
            sale.paid_at        = timezone.now()
            sale.save(update_fields=['status', 'payment_method', 'paid_at'])

            # WHY update_fields: Only update these 3 columns in SQL.
            # Without it: UPDATE sets ALL columns — wasteful and risky
            # if another process modified a different field concurrently.

        return sale


    @staticmethod
    def void_sale(sale_id: int, voided_by) -> Sale:
        """
        Cancels a sale. REVERSES the stock deduction.
        
        WHY reverse stock: If a customer cancels their order,
        the Biryani goes back to inventory. The StockLog records
        a positive entry (restock) to reverse the earlier SALE deduction.
        """

        try:
            sale = Sale.objects.select_related('branch').prefetch_related(
                'items__menu_item'
            ).get(id=sale_id)
        except Sale.DoesNotExist:
            raise ValueError(f"Sale #{sale_id} not found.")

        if sale.status == Sale.Status.VOID:
            raise ValueError(f"Sale {sale.bill_number} is already voided.")

        if sale.status == Sale.Status.PAID:
            raise ValueError(
                f"Sale {sale.bill_number} is already PAID. "
                f"Issue a refund instead of voiding."
            )

        with transaction.atomic():

            # Reverse every stock deduction from this sale
            for sale_item in sale.items.all():
                InventoryService.add_stock(
                    menu_item = sale_item.menu_item,
                    branch    = sale.branch,
                    quantity  = sale_item.quantity,   # Positive = adding back
                    user      = voided_by,
                    note      = f"Void: {sale.bill_number}"
                )

            sale.status = Sale.Status.VOID
            sale.save(update_fields=['status'])

        return sale


    @staticmethod
    def get_sale_detail(sale_id: int) -> dict:
        """
        Returns complete sale data for receipt printing and display.
        Used by Phase 6 (thermal printer) and mobile app.
        """

        try:
            sale = (
                Sale.objects
                .select_related('branch', 'billed_by', 'member')
                .prefetch_related('items', 'payments')
                .get(id=sale_id)
            )
        except Sale.DoesNotExist:
            raise ValueError(f"Sale #{sale_id} not found.")

        return {
            'bill_number':    sale.bill_number,
            'branch':         sale.branch.name,
            'billed_by':      sale.billed_by.full_name if sale.billed_by else '',
            'customer_name':  sale.customer_name,
            'table_number':   sale.table_number,
            'status':         sale.status,
            'payment_method': sale.payment_method,
            'subtotal':       float(sale.subtotal),
            'tax_total':      float(sale.tax_total),
            'discount':       float(sale.discount_amount),
            'total':          float(sale.total),
            'created_at':     sale.created_at.isoformat(),
            'paid_at':        sale.paid_at.isoformat() if sale.paid_at else None,
            'items': [
                {
                    'short_code': item.short_code,
                    'name':       item.item_name,
                    'quantity':   item.quantity,
                    'unit_price': float(item.unit_price),
                    'tax_amount': float(item.tax_amount),
                    'line_total': float(item.line_total),
                }
                for item in sale.items.all()
            ],
            'payments': [
                {
                    'method':          p.method,
                    'amount':          float(p.amount),
                    'transaction_ref': p.transaction_ref,
                }
                for p in sale.payments.all()
            ],
        }