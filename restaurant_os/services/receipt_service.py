from decimal import Decimal
from datetime import datetime


class ReceiptService:
    """
    Handles all thermal receipt printing logic.

    Completely decoupled from the billing engine.
    SalesService produces data. ReceiptService formats it.

    Supports three printer connection types:
    - USB  (direct cable — most common in restaurants)
    - Network (WiFi/LAN printer)
    - File (saves receipt as text — for testing without hardware)
    """

    # ── Restaurant Configuration ──────────────────────────────────
    # In production, load these from settings or database
    RESTAURANT_NAME    = "RESTAURANT OS"
    RESTAURANT_ADDRESS = "Chalakudy, Kerala"
    RESTAURANT_PHONE   = "+91 98765 43210"
    RESTAURANT_GSTIN   = "32ABCDE1234F1Z5"
    FOOTER_MESSAGE     = "Thank you! Visit again."

    # Receipt paper width in characters (48 or 42 for most printers)
    PAPER_WIDTH = 48

    @staticmethod
    def _get_printer(connection_type='usb', **kwargs):
        """
        Returns the correct printer object based on connection type.

        WHY three types:
        - USB:     direct cable, most reliable, single restaurant
        - Network: WiFi/LAN, needed for multi-branch where printer
                   is across the room from the billing PC
        - File:    saves to a text file for testing — run this
                   entire phase without owning a printer
        """
        from escpos import printer as escpos_printer

        if connection_type == 'usb':
            # idVendor and idProduct are on the printer's label
            # or find them with: system_profiler SPUSBDataType (macOS)
            vendor_id  = kwargs.get('vendor_id',  0x04b8)  # Epson default
            product_id = kwargs.get('product_id', 0x0202)
            return escpos_printer.Usb(vendor_id, product_id)

        elif connection_type == 'network':
            host = kwargs.get('host', '192.168.1.100')
            port = kwargs.get('port', 9100)
            return escpos_printer.Network(host, port)

        elif connection_type == 'file':
            # WHY File printer: test the entire receipt layout
            # without owning hardware. Output goes to a .txt file.
            filepath = kwargs.get('filepath', '/tmp/receipt.txt')
            return escpos_printer.File(filepath)

        else:
            raise ValueError(f"Unknown connection type: {connection_type}")

    @staticmethod
    def _divider(char='-', width=None):
        """Returns a full-width divider line."""
        width = width or ReceiptService.PAPER_WIDTH
        return char * width

    @staticmethod
    def _center(text, width=None):
        """Centers text within the paper width."""
        width = width or ReceiptService.PAPER_WIDTH
        return text.center(width)

    @staticmethod
    def _left_right(left, right, width=None):
        """
        Creates a two-column line: left text and right text
        on the same line, padded to fill the paper width.

        Example:
        "Chicken Biryani x2      ₹378.00"
        """
        width = width or ReceiptService.PAPER_WIDTH
        # How much space to pad between left and right
        padding = width - len(left) - len(right)
        if padding < 1:
            # Truncate left text if too long
            left = left[:width - len(right) - 1]
            padding = 1
        return left + ' ' * padding + right

    @staticmethod
    def build_receipt_lines(sale_data: dict) -> list:
        """
        Converts sale_data dict into a list of formatted lines.

        Returns a list of tuples: (text, style)
        Styles: 'normal', 'bold', 'center', 'title', 'divider'

        WHY return a list instead of printing directly:
        This lets us: test the layout without a printer,
        build a text preview for the mobile app,
        and use the same data for email receipts.
        """
        W = ReceiptService.PAPER_WIDTH
        lines = []

        def add(text, style='normal'):
            lines.append((text, style))

        # ── Header ────────────────────────────────────────────────
        add(ReceiptService._center(ReceiptService.RESTAURANT_NAME), 'title')
        add(ReceiptService._center(ReceiptService.RESTAURANT_ADDRESS), 'center')
        add(ReceiptService._center(ReceiptService.RESTAURANT_PHONE), 'center')
        add(ReceiptService._divider('='), 'divider')

        # ── Bill Info ─────────────────────────────────────────────
        add(ReceiptService._left_right(
            'Bill No:', sale_data['bill_number']
        ))
        add(ReceiptService._left_right(
            'Date:', datetime.fromisoformat(
                sale_data['created_at']
            ).strftime('%d/%m/%Y %H:%M')
        ))
        add(ReceiptService._left_right(
            'Cashier:', sale_data.get('billed_by', 'Staff')
        ))

        if sale_data.get('table_number'):
            add(ReceiptService._left_right(
                'Table:', sale_data['table_number']
            ))

        if sale_data.get('customer_name'):
            add(ReceiptService._left_right(
                'Customer:', sale_data['customer_name']
            ))

        add(ReceiptService._divider('-'), 'divider')

        # ── Column Headers ────────────────────────────────────────
        add(ReceiptService._left_right('Item', 'Amount'))
        add(ReceiptService._divider('-'), 'divider')

        # ── Line Items ────────────────────────────────────────────
        for item in sale_data['items']:
            # Line 1: Item name
            item_label = f"{item['name']}"
            if len(item_label) > W - 12:
                item_label = item_label[:W - 12]
            add(item_label)

            # Line 2: qty × price = total (indented)
            qty_line = (
                f"  {item['quantity']} x "
                f"Rs.{item['unit_price']:.2f}"
            )
            amount = f"Rs.{item['line_total']:.2f}"
            add(ReceiptService._left_right(qty_line, amount))

        add(ReceiptService._divider('-'), 'divider')

        # ── Totals ────────────────────────────────────────────────
        add(ReceiptService._left_right(
            'Subtotal:',
            f"Rs.{sale_data['subtotal']:.2f}"
        ))
        add(ReceiptService._left_right(
            'GST:',
            f"Rs.{sale_data['tax_total']:.2f}"
        ))

        if sale_data.get('discount', 0) > 0:
            add(ReceiptService._left_right(
                'Discount:',
                f"-Rs.{sale_data['discount']:.2f}"
            ))

        add(ReceiptService._divider('='), 'divider')
        add(ReceiptService._left_right(
            'TOTAL:',
            f"Rs.{sale_data['total']:.2f}"
        ), 'bold')
        add(ReceiptService._divider('='), 'divider')

        # ── Payment Info ──────────────────────────────────────────
        for payment in sale_data.get('payments', []):
            add(ReceiptService._left_right(
                f"Paid ({payment['method']}):",
                f"Rs.{payment['amount']:.2f}"
            ))

        # ── GSTIN ─────────────────────────────────────────────────
        add('')
        add(ReceiptService._center(
            f"GSTIN: {ReceiptService.RESTAURANT_GSTIN}"
        ), 'center')

        # ── Member info ───────────────────────────────────────────
        if sale_data.get('member_name'):
            add(ReceiptService._divider('-'), 'divider')
            add(ReceiptService._left_right(
                'Member:', sale_data['member_name']
            ))

        add(ReceiptService._divider('='), 'divider')

        # ── Footer ────────────────────────────────────────────────
        add(ReceiptService._center(ReceiptService.FOOTER_MESSAGE), 'center')
        add(ReceiptService._center('Powered by Restaurant OS'), 'center')
        add('')
        add('')  # Blank lines before cut

        return lines

    @staticmethod
    def print_receipt(sale_data: dict,
                      connection_type='file',
                      **printer_kwargs) -> dict:
        """
        The main print function.

        Takes sale_data from SalesService.get_sale_detail()
        and prints it to the thermal printer.

        WHY default to 'file':
        In development you don't have a printer attached.
        File mode saves the receipt to /tmp/receipt.txt
        so you can see exactly what would print.
        """
        try:
            p = ReceiptService._get_printer(
                connection_type, **printer_kwargs
            )

            lines = ReceiptService.build_receipt_lines(sale_data)

            # ── Send to printer ───────────────────────────────────
            p.set(align='left', font='a', bold=False, height=1)

            for text, style in lines:
                if style == 'title':
                    p.set(align='center', bold=True, height=2)
                    p.text(text + '\n')
                    p.set(align='left', bold=False, height=1)

                elif style == 'bold':
                    p.set(bold=True)
                    p.text(text + '\n')
                    p.set(bold=False)

                elif style == 'center':
                    p.set(align='center')
                    p.text(text + '\n')
                    p.set(align='left')

                elif style == 'divider':
                    p.text(text + '\n')

                else:
                    p.text(text + '\n')

            # ── Cut the paper ─────────────────────────────────────
            # WHY partial cut: leaves a small tear strip
            # so the receipt stays until manually torn
            p.cut(mode='PART')

            return {
                'success': True,
                'message': f"Receipt printed: {sale_data['bill_number']}",
            }

        except Exception as e:
            return {
                'success': False,
                'error':   str(e),
                'message': 'Printing failed. Receipt can be reprinted.',
            }

    @staticmethod
    def preview_receipt(sale_data: dict) -> str:
        """
        Returns the receipt as a plain text string.
        Used by:
        - The API endpoint (send to mobile app)
        - Testing without hardware
        - Email receipts
        """
        lines = ReceiptService.build_receipt_lines(sale_data)
        return '\n'.join(text for text, _ in lines)