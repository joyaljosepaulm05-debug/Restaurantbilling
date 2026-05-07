from datetime import date, timedelta
from django.db.models import (
    Sum, Count, Avg, Max, Min,
    F, Q, Value, DecimalField
)
from django.db.models.functions import (
    TruncDate, TruncWeek, TruncMonth,
    Coalesce
)
from django.utils import timezone
from apps.billing.models import Sale, SaleItem
from apps.inventory.models import MenuItem
from apps.accounts.models import Branch, User
from apps.attendance.models import Attendance
from apps.members.models import Member, CreditLedger


class AnalyticsService:
    """
    All owner analytics logic lives here.

    Key principle: push ALL calculations to PostgreSQL.
    Never fetch rows and loop in Python.
    Sum, Count, Avg, Group By — all in SQL.
    """

    # ── Dashboard Summary ─────────────────────────────────────────

    @staticmethod
    def get_dashboard_summary(owner, target_date=None) -> dict:
        """
        The main dashboard card — loads when owner opens the app.
        Returns today's key metrics across ALL branches.

        WHY Coalesce(..., 0):
        If no sales exist for today, Sum returns None.
        Coalesce converts None → 0 so the frontend never
        gets a null and crashes.
        """
        target_date = target_date or date.today()

        # Base queryset — all PAID sales on target date
        base = Sale.objects.filter(
            status=Sale.Status.PAID,
            created_at__date=target_date
        )

        # Single DB query with multiple aggregations
        totals = base.aggregate(
            total_revenue  = Coalesce(Sum('total'),    0,
                               output_field=DecimalField()),
            total_bills    = Count('id'),
            avg_bill_value = Coalesce(Avg('total'),    0,
                               output_field=DecimalField()),
            total_tax      = Coalesce(Sum('tax_total'), 0,
                               output_field=DecimalField()),
        )

        # Items sold today (from SaleItems linked to today's sales)
        items_sold = SaleItem.objects.filter(
            sale__in=base
        ).aggregate(
            total_items=Coalesce(Sum('quantity'), 0)
        )['total_items']

        # Active branches today (branches that had at least 1 sale)
        active_branches = base.values(
            'branch'
        ).distinct().count()

        # Yesterday's revenue for comparison
        yesterday = target_date - timedelta(days=1)
        yesterday_revenue = Sale.objects.filter(
            status=Sale.Status.PAID,
            created_at__date=yesterday
        ).aggregate(
            rev=Coalesce(Sum('total'), 0,
                output_field=DecimalField())
        )['rev']

        # Revenue change percentage
        if yesterday_revenue > 0:
            change_pct = float(
                (totals['total_revenue'] - yesterday_revenue)
                / yesterday_revenue * 100
            )
        else:
            change_pct = 100.0 if totals['total_revenue'] > 0 else 0.0

        return {
            'date':               target_date.isoformat(),
            'total_revenue':      float(totals['total_revenue']),
            'total_bills':        totals['total_bills'],
            'avg_bill_value':     round(float(
                                    totals['avg_bill_value']), 2),
            'total_tax_collected':float(totals['total_tax']),
            'total_items_sold':   items_sold,
            'active_branches':    active_branches,
            'revenue_vs_yesterday': {
                'yesterday_revenue': float(yesterday_revenue),
                'change_percent':    round(change_pct, 1),
                'trend':             'up' if change_pct >= 0 else 'down',
            },
        }

    # ── Branch Performance ────────────────────────────────────────

    @staticmethod
    def get_branch_performance(target_date=None) -> list:
        """
        Revenue breakdown by branch for today.
        Lets the owner compare branches at a glance.

        Uses values('branch__name') to GROUP BY branch
        in a single SQL query — not a Python loop.
        """
        target_date = target_date or date.today()

        results = (
            Sale.objects
            .filter(
                status=Sale.Status.PAID,
                created_at__date=target_date
            )
            .values('branch__id', 'branch__name')
            .annotate(
                revenue      = Coalesce(Sum('total'), 0,
                                 output_field=DecimalField()),
                bill_count   = Count('id'),
                avg_bill     = Coalesce(Avg('total'), 0,
                                 output_field=DecimalField()),
                tax_collected= Coalesce(Sum('tax_total'), 0,
                                 output_field=DecimalField()),
            )
            .order_by('-revenue')   # Highest revenue first
        )

        return [
            {
                'branch_id':     r['branch__id'],
                'branch_name':   r['branch__name'],
                'revenue':       float(r['revenue']),
                'bill_count':    r['bill_count'],
                'avg_bill':      round(float(r['avg_bill']), 2),
                'tax_collected': float(r['tax_collected']),
            }
            for r in results
        ]

    # ── Revenue Trend ─────────────────────────────────────────────

    @staticmethod
    def get_revenue_trend(days: int = 7, branch_id=None) -> list:
        """
        Daily revenue for the last N days.
        Powers the line chart in the mobile app.

        TruncDate groups all sales on the same day together.
        The result is one row per day with the sum.
        """
        end_date   = date.today()
        start_date = end_date - timedelta(days=days - 1)

        qs = Sale.objects.filter(
            status=Sale.Status.PAID,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        )

        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        daily = (
            qs
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                revenue    = Coalesce(Sum('total'), 0,
                               output_field=DecimalField()),
                bill_count = Count('id'),
            )
            .order_by('day')
        )

        # Build complete date range (fill missing days with 0)
        # WHY: If no sales on Tuesday, SQL won't return a Tuesday row.
        # The frontend chart needs all 7 points to draw correctly.
        revenue_by_day = {
            r['day'].isoformat(): r
            for r in daily
        }

        result = []
        for i in range(days):
            d = start_date + timedelta(days=i)
            key = d.isoformat()
            if key in revenue_by_day:
                r = revenue_by_day[key]
                result.append({
                    'date':       key,
                    'revenue':    float(r['revenue']),
                    'bill_count': r['bill_count'],
                })
            else:
                result.append({
                    'date':       key,
                    'revenue':    0.0,
                    'bill_count': 0,
                })

        return result

    # ── Top Selling Items ─────────────────────────────────────────

    @staticmethod
    def get_top_items(limit: int = 10,
                      days: int = 7,
                      branch_id=None) -> list:
        """
        Most sold menu items by quantity over the last N days.
        Powers the "bestsellers" section in the mobile app.

        Queries SaleItem directly and groups by menu_item.
        One SQL query with GROUP BY and ORDER BY.
        """
        start_date = date.today() - timedelta(days=days - 1)

        qs = SaleItem.objects.filter(
            sale__status=Sale.Status.PAID,
            sale__created_at__date__gte=start_date,
        )

        if branch_id:
            qs = qs.filter(sale__branch_id=branch_id)

        results = (
            qs
            .values('menu_item__id',
                    'menu_item__name',
                    'menu_item__short_code',
                    'menu_item__category__name')
            .annotate(
                total_qty     = Sum('quantity'),
                total_revenue = Sum('line_total'),
                times_ordered = Count('sale', distinct=True),
            )
            .order_by('-total_qty')[:limit]
        )

        return [
            {
                'item_id':      r['menu_item__id'],
                'name':         r['menu_item__name'],
                'short_code':   r['menu_item__short_code'],
                'category':     r['menu_item__category__name'],
                'total_qty':    r['total_qty'],
                'total_revenue':float(r['total_revenue']),
                'times_ordered':r['times_ordered'],
            }
            for r in results
        ]

    # ── Payment Method Breakdown ──────────────────────────────────

    @staticmethod
    def get_payment_breakdown(target_date=None,
                              branch_id=None) -> list:
        """
        How customers are paying: Cash vs UPI vs Card vs Credit.
        Helps owner decide whether to add more payment terminals.
        """
        target_date = target_date or date.today()

        qs = Sale.objects.filter(
            status=Sale.Status.PAID,
            created_at__date=target_date,
        )

        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        results = (
            qs
            .values('payment_method')
            .annotate(
                count   = Count('id'),
                revenue = Sum('total'),
            )
            .order_by('-revenue')
        )

        total_revenue = sum(
            float(r['revenue']) for r in results if r['revenue']
        )

        return [
            {
                'method':     r['payment_method'],
                'count':      r['count'],
                'revenue':    float(r['revenue'] or 0),
                'percentage': round(
                    float(r['revenue'] or 0) / total_revenue * 100
                    if total_revenue > 0 else 0, 1
                ),
            }
            for r in results
        ]

    # ── Attendance Summary ────────────────────────────────────────

    @staticmethod
    def get_attendance_overview(target_date=None) -> dict:
        """
        Staff attendance summary across all branches.
        Owner sees at a glance: who showed up, who didn't.
        """
        target_date = target_date or date.today()

        # Total active staff
        total_staff = User.objects.filter(
            is_active=True,
            role__in=['BILLING', 'INVENTORY', 'MANAGER']
        ).count()

        # Who checked in today
        checked_in = Attendance.objects.filter(
            timestamp__date=target_date,
            attendance_type=Attendance.AttendanceType.CHECK_IN
        ).values('user').distinct().count()

        # Late arrivals
        late_count = Attendance.objects.filter(
            timestamp__date=target_date,
            attendance_type=Attendance.AttendanceType.CHECK_IN,
            status=Attendance.Status.LATE
        ).count()

        # Per-branch breakdown
        branch_attendance = (
            Attendance.objects
            .filter(
                timestamp__date=target_date,
                attendance_type=Attendance.AttendanceType.CHECK_IN
            )
            .values('branch__name')
            .annotate(present=Count('user', distinct=True))
            .order_by('branch__name')
        )

        return {
            'date':         target_date.isoformat(),
            'total_staff':  total_staff,
            'checked_in':   checked_in,
            'absent':       total_staff - checked_in,
            'late':         late_count,
            'attendance_rate': round(
                checked_in / total_staff * 100
                if total_staff > 0 else 0, 1
            ),
            'by_branch': [
                {
                    'branch':  r['branch__name'],
                    'present': r['present'],
                }
                for r in branch_attendance
            ],
        }

    # ── Top Members ───────────────────────────────────────────────

    @staticmethod
    def get_top_members(limit: int = 10,
                        days: int = 30) -> list:
        """
        Most valuable members by spend in the last N days.
        Helps owner identify loyalty programme candidates.
        """
        start_date = date.today() - timedelta(days=days - 1)

        results = (
            Sale.objects
            .filter(
                status=Sale.Status.PAID,
                created_at__date__gte=start_date,
                member__isnull=False,   # Only member sales
            )
            .values(
                'member__id',
                'member__full_name',
                'member__card_number',
                'member__tier',
            )
            .annotate(
                total_spent  = Sum('total'),
                visit_count  = Count('id'),
                avg_spend    = Avg('total'),
            )
            .order_by('-total_spent')[:limit]
        )

        return [
            {
                'member_id':   r['member__id'],
                'full_name':   r['member__full_name'],
                'card_number': r['member__card_number'],
                'tier':        r['member__tier'],
                'total_spent': float(r['total_spent']),
                'visit_count': r['visit_count'],
                'avg_spend':   round(float(r['avg_spend']), 2),
            }
            for r in results
        ]

    # ── Hourly Sales Pattern ──────────────────────────────────────

    @staticmethod
    def get_hourly_pattern(target_date=None,
                           branch_id=None) -> list:
        """
        Sales volume by hour of day.
        Helps owner decide staffing levels per time slot.
        Breakfast rush? Lunch peak? Quiet afternoons?
        """
        from django.db.models.functions import ExtractHour

        target_date = target_date or date.today()

        qs = Sale.objects.filter(
            status=Sale.Status.PAID,
            created_at__date=target_date,
        )

        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        hourly = (
            qs
            .annotate(hour=ExtractHour('created_at'))
            .values('hour')
            .annotate(
                bill_count = Count('id'),
                revenue    = Coalesce(Sum('total'), 0,
                               output_field=DecimalField()),
            )
            .order_by('hour')
        )

        # Fill all 24 hours
        by_hour = {r['hour']: r for r in hourly}

        return [
            {
                'hour':       h,
                'label':      f"{h:02d}:00",
                'bill_count': by_hour[h]['bill_count']
                              if h in by_hour else 0,
                'revenue':    float(by_hour[h]['revenue'])
                              if h in by_hour else 0.0,
            }
            for h in range(24)
        ]