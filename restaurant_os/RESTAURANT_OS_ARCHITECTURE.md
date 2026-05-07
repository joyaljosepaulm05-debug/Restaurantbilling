# Restaurant OS — Complete Architecture Reference

> Commercial-grade multi-branch restaurant POS system.
> Backend: Django REST Framework + PostgreSQL.
> Frontend: Next.js 14 + TypeScript + Tailwind CSS.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Repository Structure](#repository-structure)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Environment Variables](#environment-variables)
8. [Running the Project](#running-the-project)
9. [Libraries Reference](#libraries-reference)
10. [Module Ownership Guide](#module-ownership-guide)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend framework | Django REST Framework | 5.0.6 / 3.15.2 |
| Database | PostgreSQL | 14+ |
| Authentication | JWT (simplejwt) | 5.3.1 |
| Frontend framework | Next.js (App Router) | 14.x |
| Frontend language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| Server state | React Query | 5.x |
| Client state | Zustand | 4.x |
| HTTP client | Axios | 1.x |
| Face recognition | face_recognition + dlib | 1.3.0 / 20.0.1 |
| Receipt printing | python-escpos | 3.1 |

---

## Repository Structure

```
Visual Studio/
├── restaurant_os/          ← Django backend
└── restaurant-pos/         ← Next.js frontend
```

---

## Backend Architecture

### Folder Structure

```
restaurant_os/
├── manage.py
├── .env                              ← secrets (never commit)
├── .python-version                   ← 3.12.3
├── venv/                             ← Python virtual environment
│
├── config/                           ← Django project config
│   ├── __init__.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── urls.py                       ← master URL router
│   └── settings/
│       ├── __init__.py
│       ├── base.py                   ← shared settings
│       ├── development.py            ← dev overrides (DEBUG=True)
│       └── production.py             ← prod overrides
│
├── apps/                             ← Django applications
│   ├── __init__.py
│   ├── accounts/                     ← Phase 1: Auth + RBAC
│   │   ├── __init__.py
│   │   ├── apps.py                   ← name = 'apps.accounts'
│   │   ├── models.py                 ← User, Branch, Role
│   │   ├── serializers.py            ← CustomTokenObtainSerializer, UserSerializer
│   │   ├── views.py                  ← LoginView, LogoutView, MeView
│   │   ├── permissions.py            ← IsOwner, IsOwnerOrManager, IsBillingStaff, IsSameBranch
│   │   ├── exceptions.py             ← custom_exception_handler
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── migrations/
│   │       └── 0001_initial.py
│   │
│   ├── inventory/                    ← Phase 2: PLU + Stock
│   │   ├── __init__.py
│   │   ├── apps.py                   ← name = 'apps.inventory'
│   │   ├── models.py                 ← Category, MenuItem, BranchMenuItem, StockLog
│   │   ├── serializers.py            ← MenuItemSerializer, PLULookupSerializer
│   │   ├── views.py                  ← PLULookupView, BillingMenuView, StockAddView
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── billing/                      ← Phase 3: Sales + Payments
│   │   ├── __init__.py
│   │   ├── apps.py                   ← name = 'apps.billing'
│   │   ├── models.py                 ← Sale, SaleItem, Payment
│   │   ├── serializers.py            ← SaleSerializer, CreateSaleSerializer, ProcessPaymentSerializer
│   │   ├── views.py                  ← CreateSaleView, ProcessPaymentView, VoidSaleView, PrintReceiptView
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── members/                      ← Phase 4: Credit Ledger
│   │   ├── __init__.py
│   │   ├── apps.py                   ← name = 'apps.members'
│   │   ├── models.py                 ← Member, CreditLedger
│   │   ├── serializers.py            ← MemberSerializer, TopUpSerializer, CardLookupSerializer
│   │   ├── views.py                  ← CardLookupView, TopUpView, MemberStatementView, CreditPaymentView
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── attendance/                   ← Phase 5: Face Recognition
│   │   ├── __init__.py
│   │   ├── apps.py                   ← name = 'apps.attendance'
│   │   ├── models.py                 ← Attendance
│   │   ├── serializers.py            ← RegisterFaceSerializer, VerifyFaceSerializer
│   │   ├── views.py                  ← RegisterFaceView, CheckInOutView, TodayAttendanceView
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   └── analytics/                    ← Phase 7: Owner Reports
│       ├── __init__.py
│       ├── apps.py                   ← name = 'apps.analytics'
│       ├── models.py                 ← (no models, reads existing tables)
│       ├── views.py                  ← DashboardSummaryView, BranchPerformanceView, MobileOwnerDashboardView
│       ├── urls.py
│       └── migrations/
│
├── services/                         ← Business logic layer
│   ├── __init__.py
│   ├── inventory_service.py          ← InventoryService (lookup_by_plu, get_stock_level, add_stock, deduct_stock)
│   ├── sales_service.py              ← SalesService (create_sale, process_payment, void_sale, process_credit_payment)
│   ├── credit_service.py             ← CreditService (top_up, debit_for_sale, reverse_entry, get_statement)
│   ├── attendance_service.py         ← AttendanceService (register_face, verify_and_mark, get_today_attendance)
│   ├── receipt_service.py            ← ReceiptService (build_receipt_lines, print_receipt, preview_receipt)
│   └── analytics_service.py         ← AnalyticsService (get_dashboard_summary, get_branch_performance, get_revenue_trend, get_top_items)
│
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
│
└── test_face_recognition.py          ← standalone face recognition test script
```

---

### Backend Design Rules

| Rule | Detail |
|---|---|
| Service layer | All business logic in `services/`. Views only handle HTTP. |
| Atomic transactions | Every multi-table write uses `transaction.atomic()` |
| Soft delete | Never hard delete. Use `is_active=False` or `status=VOID` |
| Denormalized financials | Sale totals frozen at billing time. Never recalculated. |
| Ledger pattern | StockLog and CreditLedger are append-only. Never edited. |
| Decimal not Float | All money fields use `DecimalField`. Never `FloatField`. |
| Branch isolation | Staff filtered by `request.user.branch` at every query. |
| JSONB fields | `face_encoding` (128 floats) and `tags` (list) stored as JSONB. |

---

### `config/urls.py` — Master Router

```python
urlpatterns = [
    path('admin/',          admin.site.urls),
    path('api/',            include('apps.accounts.urls')),
    path('api/inventory/',  include('apps.inventory.urls')),
    path('api/billing/',    include('apps.billing.urls')),
    path('api/members/',    include('apps.members.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/analytics/',  include('apps.analytics.urls')),
]
```

---

### `config/settings/base.py` — Key Settings

```python
AUTH_USER_MODEL = 'accounts.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
TIME_ZONE = 'Asia/Kolkata'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'EXCEPTION_HANDLER': 'apps.accounts.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'TOKEN_OBTAIN_SERIALIZER': 'apps.accounts.serializers.CustomTokenObtainSerializer',
}
```

---

### Permission Classes

| Class | File | Who can access |
|---|---|---|
| `IsOwner` | `apps/accounts/permissions.py` | OWNER only |
| `IsOwnerOrManager` | same | OWNER, MANAGER |
| `IsBillingStaff` | same | OWNER, MANAGER, BILLING |
| `IsSameBranch` | same | Object-level branch check |

---

### Key Model Fields

```python
# accounts/models.py
class User(AbstractBaseUser, PermissionsMixin):
    email           # USERNAME_FIELD
    full_name
    role            # TextChoices: OWNER, MANAGER, BILLING, INVENTORY
    branch          # FK to Branch (null for OWNER)
    face_encoding   # JSONField — 128 floats for face recognition
    is_active

class Branch(models.Model):
    name, address, phone, is_active

# inventory/models.py
class MenuItem(models.Model):
    short_code      # unique, db_index=True (the PLU code)
    base_price      # DecimalField
    tax_percent     # DecimalField
    category        # FK to Category
    tags            # JSONField
    is_available, is_active

class StockLog(models.Model):
    menu_item, branch
    quantity        # positive=add, negative=deduct
    action          # RESTOCK, SALE, WASTE, ADJUST
    created_by

# billing/models.py
class Sale(models.Model):
    bill_number     # auto-generated BILL-YYYYMMDD-XXXX
    branch, billed_by, member
    subtotal, tax_total, discount_amount, total  # all DecimalField, frozen
    status          # PENDING, PAID, VOID
    payment_method  # CASH, CARD, UPI, CREDIT, SPLIT

class SaleItem(models.Model):
    sale, menu_item
    item_name, short_code   # snapshot at time of billing
    unit_price, tax_percent, quantity, tax_amount, line_total

class Payment(models.Model):
    sale, method, amount, transaction_ref, received_by

# members/models.py
class Member(models.Model):
    card_number     # auto-generated MEM-XXXXXXXX, indexed
    phone           # unique, indexed
    tier            # STANDARD, SILVER, GOLD, PLATINUM
    credit_limit    # DecimalField, max negative balance allowed
    # NO balance field — computed from CreditLedger via SUM

class CreditLedger(models.Model):
    member, sale
    amount          # positive=credit, negative=debit
    entry_type      # CREDIT, DEBIT, REVERSAL, REFUND
    # NEVER edited or deleted — append only

# attendance/models.py
class Attendance(models.Model):
    user, branch
    attendance_type  # CHECK_IN, CHECK_OUT
    status           # PRESENT, LATE, EARLY_OUT
    confidence_score # float, distance from best match
    timestamp
```

---

### Service Layer Reference

```python
# services/inventory_service.py
InventoryService.lookup_by_plu(short_code, branch)  → dict
InventoryService.get_stock_level(menu_item_id, branch_id)  → int
InventoryService.add_stock(menu_item, branch, quantity, user, note)
InventoryService.deduct_stock(menu_item, branch, quantity, user, action)
InventoryService.get_menu_for_branch(branch)  → dict grouped by category

# services/sales_service.py
SalesService.create_sale(branch, billed_by, items_data, ...)  → Sale
SalesService.process_payment(sale_id, payments_data, received_by)  → Sale
SalesService.void_sale(sale_id, voided_by)  → Sale
SalesService.process_credit_payment(sale_id, member_card, received_by)  → Sale
SalesService.get_sale_detail(sale_id)  → dict

# services/credit_service.py
CreditService.get_member_by_card(card_number)  → Member
CreditService.get_member_by_phone(phone)  → Member
CreditService.get_balance_summary(member)  → dict
CreditService.top_up(member, amount, created_by, description)  → CreditLedger
CreditService.debit_for_sale(member, sale, amount, created_by)  → CreditLedger
CreditService.reverse_entry(original_entry_id, created_by, reason)  → CreditLedger
CreditService.get_statement(member, limit=20)  → list

# services/attendance_service.py
AttendanceService.register_face(user, image_data)  → dict
AttendanceService.verify_and_mark(image_data, branch, attendance_type)  → dict
AttendanceService.get_today_attendance(branch)  → list
AttendanceService.get_staff_summary(branch, target_date)  → dict

# services/receipt_service.py
ReceiptService.build_receipt_lines(sale_data)  → list of (text, style) tuples
ReceiptService.print_receipt(sale_data, connection_type, **kwargs)  → dict
ReceiptService.preview_receipt(sale_data)  → str

# services/analytics_service.py
AnalyticsService.get_dashboard_summary(owner, target_date)  → dict
AnalyticsService.get_branch_performance(target_date)  → list
AnalyticsService.get_revenue_trend(days, branch_id)  → list
AnalyticsService.get_top_items(limit, days, branch_id)  → list
AnalyticsService.get_payment_breakdown(target_date, branch_id)  → list
AnalyticsService.get_attendance_overview(target_date)  → dict
AnalyticsService.get_top_members(limit, days)  → list
AnalyticsService.get_hourly_pattern(target_date, branch_id)  → list
```

---

## Frontend Architecture

### Folder Structure

```
restaurant-pos/
├── .env.local                        ← NEXT_PUBLIC_API_URL=http://localhost:8000/api
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── src/
│   ├── middleware.ts                 ← route protection (reads cookie)
│   │
│   ├── app/
│   │   ├── layout.tsx                ← root layout + Providers
│   │   ├── providers.tsx             ← React Query client
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                   ← no shared layout, public routes
│   │   │   └── login/
│   │   │       └── page.tsx          ← login form
│   │   │
│   │   └── (dashboard)/              ← protected routes
│   │       ├── billing/
│   │       │   └── page.tsx          ← mounts BillingScreen
│   │       └── analytics/
│   │           └── page.tsx          ← mounts AnalyticsDashboard
│   │
│   ├── components/
│   │   ├── billing/
│   │   │   ├── BillingScreen.tsx     ← main billing page container
│   │   │   ├── PLUInput.tsx          ← PLU code input (always focused)
│   │   │   ├── CartTable.tsx         ← cart items with qty controls
│   │   │   ├── CartSummary.tsx       ← totals + checkout button
│   │   │   └── PaymentModal.tsx      ← cash/card/UPI/credit modal
│   │   │
│   │   └── analytics/
│   │       ├── AnalyticsDashboard.tsx  ← main analytics container
│   │       ├── SummaryCards.tsx      ← 4 metric cards
│   │       ├── RevenueTrendChart.tsx ← 7-day line chart
│   │       ├── TopItemsChart.tsx     ← horizontal bar chart
│   │       ├── BranchCards.tsx       ← branch revenue bars
│   │       ├── PaymentBreakdown.tsx  ← donut chart
│   │       └── AttendanceSummary.tsx ← present/absent/late
│   │
│   ├── hooks/
│   │   ├── usePLULookup.ts           ← PLU search state machine
│   │   └── useAnalytics.ts           ← React Query analytics fetcher
│   │
│   ├── lib/
│   │   └── api.ts                    ← axios instance + all API functions
│   │
│   ├── store/
│   │   ├── authStore.ts              ← Zustand auth (user, tokens, role helpers)
│   │   └── cartStore.ts              ← Zustand cart (items, computed totals)
│   │
│   └── types/
│       └── index.ts                  ← all TypeScript interfaces
```

---

### Frontend Design Rules

| Rule | Detail |
|---|---|
| Route groups | `(auth)` = no layout. `(dashboard)` = protected layout. Invisible in URL. |
| Auth dual-write | Token saved to both `localStorage` (axios) and `cookie` (middleware). |
| Computed totals | `subtotal()`, `taxTotal()`, `grandTotal()` are functions, not stored values. |
| Custom hooks | Logic in hooks, UI in components. `usePLULookup` separate from `PLUInput`. |
| TypeScript interfaces | Every interface mirrors a Django serializer field list exactly. |
| React Query | Server state (analytics, sales). Zustand for client state (cart, auth). |

---

### `src/lib/api.ts` — All API Functions

```typescript
// Auth
authApi.login(email, password)
authApi.logout(refresh)
authApi.me()

// Inventory
inventoryApi.pluLookup(shortCode)
inventoryApi.getMenu()
inventoryApi.getItems(params)
inventoryApi.createItem(data)
inventoryApi.getCategories()

// Billing
billingApi.createSale(data)       // data includes branch_id for Owner
billingApi.getSales(params)
billingApi.getSale(id)
billingApi.processPayment(id, payments)
billingApi.voidSale(id)
billingApi.printReceipt(id, previewOnly)

// Members
membersApi.lookup(cardNumber)
membersApi.getMembers(search)
membersApi.createMember(data)
membersApi.topUp(id, amount, description)
membersApi.getStatement(id)

// Analytics
analyticsApi.getDashboard(date)
analyticsApi.getTrend(days, branchId)
analyticsApi.getTopItems(days, limit)
analyticsApi.getBranchPerformance()
analyticsApi.getMobileDashboard()
```

---

### Axios Interceptors

```
Request interceptor:
  reads access_token from localStorage
  adds Authorization: Bearer <token> to every request

Response interceptor:
  401 received → reads refresh_token from localStorage
              → POST /api/auth/refresh/
              → saves new access_token
              → retries original request
  refresh fails → clears all tokens → redirects to /login
```

---

### `src/store/authStore.ts` — Auth State

```typescript
useAuthStore()
  .user             // User object with id, email, role, branch_id
  .isAuthenticated  // boolean
  .setAuth(user, access, refresh)   // saves to store + localStorage + cookie
  .clearAuth()                      // clears store + localStorage + cookie
  .isOwner()        // role === 'OWNER'
  .isManager()      // role in ['OWNER', 'MANAGER']
  .isBilling()      // role in ['OWNER', 'MANAGER', 'BILLING']
  .canAccessBranch(branchId)
```

### `src/store/cartStore.ts` — Cart State

```typescript
useCartStore()
  .items[]          // CartItem array
  .addItem(item)    // increments qty if exists, pushes if new
  .removeItem(shortCode)
  .updateQuantity(shortCode, quantity)
  .clearCart()      // called after successful payment
  .customerName, .tableNumber, .branchId
  .subtotal()       // computed — sum of unit_price × quantity
  .taxTotal()       // computed — sum of tax_amount
  .grandTotal()     // computed — subtotal + taxTotal
  .itemCount()      // computed — sum of all quantities
```

---

## Database Schema

### 12 Tables

| Table | App | Purpose |
|---|---|---|
| `accounts_branch` | accounts | Restaurant branches |
| `accounts_user` | accounts | Staff + owners (custom user) |
| `inventory_category` | inventory | Menu categories |
| `inventory_menuitem` | inventory | Menu items with PLU code |
| `inventory_branchmenuitem` | inventory | Per-branch price overrides |
| `inventory_stocklog` | inventory | Immutable stock ledger |
| `billing_sale` | billing | Sale header with frozen totals |
| `billing_saleitem` | billing | Line items (price snapshot) |
| `billing_payment` | billing | Payment records per sale |
| `members_member` | members | Loyalty members |
| `members_creditledger` | members | Immutable credit ledger |
| `attendance_attendance` | attendance | Check-in/out records |

### 8 Custom Indexes

| Index name | Table | Field | Why |
|---|---|---|---|
| `idx_user_role` | accounts_user | role | permission checks |
| `idx_user_branch` | accounts_user | branch_id | branch filtering |
| `idx_item_plu` | inventory_menuitem | short_code | PLU lookup < 1ms |
| `idx_item_cat_available` | inventory_menuitem | category + is_available | billing screen load |
| `idx_stock_item_branch` | inventory_stocklog | menu_item + branch | stock level SUM |
| `idx_sale_branch_date` | billing_sale | branch + created_at | dashboard queries |
| `idx_member_card` | members_member | card_number | card scan |
| `idx_member_phone` | members_member | phone | phone lookup |

---

## API Endpoints

### Auth — `/api/`

| Method | URL | Permission | Purpose |
|---|---|---|---|
| POST | `/api/auth/login/` | Public | Get JWT tokens |
| POST | `/api/auth/logout/` | Authenticated | Blacklist refresh token |
| POST | `/api/auth/refresh/` | Public | Get new access token |
| GET | `/api/auth/me/` | Authenticated | Current user profile |
| GET | `/api/users/` | OwnerOrManager | List staff |
| GET/POST | `/api/branches/` | Owner | List/create branches |

### Inventory — `/api/inventory/`

| Method | URL | Permission | Purpose |
|---|---|---|---|
| GET | `/plu/<short_code>/` | BillingStaff | PLU lookup < 1ms |
| GET | `/menu/` | BillingStaff | Full menu for billing screen |
| GET/POST | `/items/` | OwnerOrManager | List/create menu items |
| GET/PUT/DELETE | `/items/<id>/` | OwnerOrManager | Item detail (DELETE = soft) |
| GET/POST | `/categories/` | OwnerOrManager | Categories |
| POST | `/stock/add/` | OwnerOrManager | Add stock (ledger entry) |
| GET | `/stock/<item_id>/` | BillingStaff | Current stock level |

### Billing — `/api/billing/`

| Method | URL | Permission | Purpose |
|---|---|---|---|
| GET | `/sales/` | BillingStaff | List sales (branch filtered) |
| POST | `/sales/create/` | BillingStaff | Create sale (atomic) |
| GET | `/sales/<id>/` | BillingStaff | Sale detail for receipt |
| POST | `/sales/<id>/pay/` | BillingStaff | Process payment |
| POST | `/sales/<id>/void/` | OwnerOrManager | Void sale + restore stock |
| POST | `/sales/<id>/print/` | BillingStaff | Print/preview receipt |
| POST | `/sales/<id>/pay-credit/` | BillingStaff | Pay with member card |

### Members — `/api/members/`

| Method | URL | Permission | Purpose |
|---|---|---|---|
| GET/POST | `/` | BillingStaff | List/create members |
| GET/PATCH | `/<id>/` | BillingStaff | Member detail |
| POST | `/lookup/` | BillingStaff | Card scan → balance |
| POST | `/<id>/topup/` | OwnerOrManager | Load credit |
| GET | `/<id>/statement/` | BillingStaff | Transaction history |

### Attendance — `/api/attendance/`

| Method | URL | Permission | Purpose |
|---|---|---|---|
| POST | `/register-face/` | OwnerOrManager | Save face encoding to User |
| POST | `/verify/` | **Public** | Face check-in (face = auth) |
| GET | `/today/` | OwnerOrManager | Today's attendance |
| GET | `/summary/` | OwnerOrManager | Present/absent count |

### Analytics — `/api/analytics/`

| Method | URL | Permission | Purpose |
|---|---|---|---|
| GET | `/dashboard/` | Owner | Today's summary |
| GET | `/branches/` | Owner | Branch comparison |
| GET | `/trend/` | Owner | Daily revenue chart data |
| GET | `/top-items/` | Owner | Bestsellers |
| GET | `/payments/` | Owner | Payment method split |
| GET | `/attendance/` | Owner | Staff attendance overview |
| GET | `/top-members/` | Owner | Top spenders |
| GET | `/hourly/` | Owner | Sales by hour |
| GET | `/mobile/` | Owner | **All of above in one request** |

---

## Environment Variables

### Backend — `restaurant_os/.env`

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=restaurant_os
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

### Frontend — `restaurant-pos/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Running the Project

### Backend

```bash
cd restaurant_os
source venv/bin/activate
python manage.py runserver
# Runs on http://localhost:8000
```

### Frontend

```bash
cd restaurant-pos
npm run dev
# Runs on http://localhost:3000
```

### First-time Setup — Backend

```bash
cd restaurant_os
python -m venv venv
source venv/bin/activate
pip install -r requirements/base.txt
# Create .env file (see above)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### First-time Setup — Frontend

```bash
cd restaurant-pos
npm install
# Create .env.local file (see above)
npm run dev
```

---

## Libraries Reference

### Backend Libraries

| Library | Version | Purpose | Used in |
|---|---|---|---|
| django | 5.0.6 | Web framework, ORM, migrations | everything |
| djangorestframework | 3.15.2 | REST API, serializers, views | all views |
| djangorestframework-simplejwt | 5.3.1 | JWT auth | accounts/ |
| psycopg2-binary | 2.9.9 | PostgreSQL driver (ARM64) | settings |
| django-cors-headers | 4.4.0 | CORS for Next.js frontend | settings |
| python-decouple | 3.8 | .env file reader | settings |
| Pillow | 10.3.0 | Image loading for face recognition | attendance/ |
| dlib | 20.0.1 | C++ ML engine (compiled ARM64) | attendance service |
| face_recognition | 1.3.0 | Face encoding + matching API | attendance service |
| face_recognition_models | 0.3.0 | Pre-trained .dat model files (~100MB) | auto-loaded |
| numpy | 2.4.4 | 128-float array math | attendance service |
| python-escpos | 3.1 | ESC/POS thermal printer protocol | receipt service |
| requests | 2.33.1 | HTTP client (test scripts only) | test scripts |
| setuptools | 82.0.1 | pkg_resources (Python 3.12 fix) | face_recognition_models |

> **Important:** `face_recognition_models/__init__.py` was manually patched to replace `from pkg_resources import resource_filename` with `import os` + `os.path.join` for Python 3.12 compatibility.

### Frontend Libraries

| Library | Version | Purpose |
|---|---|---|
| next | 14.x | React framework with App Router |
| react | 18.x | UI library |
| typescript | 5.x | Type safety |
| tailwindcss | 3.x | Utility CSS |
| axios | 1.x | HTTP client with interceptors |
| @tanstack/react-query | 5.x | Server state, caching, refetching |
| zustand | 4.x | Client state (auth + cart) |
| recharts | 2.x | Charts (Line, Bar, Pie) |
| lucide-react | latest | SVG icon library |

---

## Module Ownership Guide

Split this system into independent workstreams. Each person needs only their section to make progress.

### Person A — Backend Core (Accounts + Auth)
**Files:** `apps/accounts/`, `config/settings/`
**Owns:** User model, Branch model, JWT auth, RBAC permissions, custom exception handler
**API routes:** `/api/auth/*`, `/api/users/`, `/api/branches/`
**Dependency:** None — this is the foundation

### Person B — Inventory Module
**Files:** `apps/inventory/`, `services/inventory_service.py`
**Owns:** Category, MenuItem, BranchMenuItem, StockLog, PLU lookup
**API routes:** `/api/inventory/*`
**Dependency:** Person A (needs User and Branch models)

### Person C — Billing Engine
**Files:** `apps/billing/`, `services/sales_service.py`, `services/receipt_service.py`
**Owns:** Sale, SaleItem, Payment, atomic transactions, receipt printing
**API routes:** `/api/billing/*`
**Dependency:** Person A (User, Branch), Person B (MenuItem)

### Person D — Member Credit System
**Files:** `apps/members/`, `services/credit_service.py`
**Owns:** Member, CreditLedger, top-up, credit payment, statement
**API routes:** `/api/members/*`
**Dependency:** Person A, Person C (Sale FK on CreditLedger)

### Person E — Attendance + Biometrics
**Files:** `apps/attendance/`, `services/attendance_service.py`
**Owns:** Attendance, face registration, face verification, check-in/out
**API routes:** `/api/attendance/*`
**Dependency:** Person A (User model only)

### Person F — Analytics
**Files:** `apps/analytics/`, `services/analytics_service.py`
**Owns:** All read-only aggregate views. No new models.
**API routes:** `/api/analytics/*`
**Dependency:** All (reads from all tables)

### Person G — Frontend Auth + Routing
**Files:** `src/middleware.ts`, `src/app/(auth)/`, `src/store/authStore.ts`, `src/lib/api.ts`, `src/types/index.ts`
**Owns:** Login page, route protection, Zustand auth store, axios client
**Dependency:** Person A backend

### Person H — Frontend Billing Screen
**Files:** `src/components/billing/`, `src/store/cartStore.ts`, `src/hooks/usePLULookup.ts`
**Owns:** PLUInput, CartTable, CartSummary, PaymentModal, BillingScreen, cart store
**Dependency:** Person G (auth), Person B + C backend

### Person I — Frontend Analytics Dashboard
**Files:** `src/components/analytics/`, `src/hooks/useAnalytics.ts`
**Owns:** All chart components, dashboard layout, React Query hooks
**Dependency:** Person G (auth), Person F backend

---

## Key Architectural Decisions

| Decision | Reason |
|---|---|
| `AbstractBaseUser` not `AbstractUser` | email as login field, custom role and branch fields from day 1 |
| `AUTH_USER_MODEL` set in Phase 1 | Changing it after migrations causes painful conflicts |
| Split settings (base/dev/prod) | Production secrets never touched in development |
| Service layer pattern | Business logic reusable by POS and mobile API without duplication |
| `transaction.atomic()` on all financial writes | Partial writes = permanent data corruption in billing systems |
| Denormalized sale totals | Prices change. Old bills must show the price at time of purchase. |
| Ledger pattern (never edit rows) | Full audit trail. Every rupee and every stock unit is traceable. |
| JSONB for face_encoding and tags | Native list storage in PostgreSQL. No separate join table needed. |
| Cookie + localStorage dual-write | Middleware reads cookies (server). Axios reads localStorage (browser). |
| Computed cart totals (not stored) | Stored totals drift when items change. Computed totals are always correct. |
| One `/api/analytics/mobile/` endpoint | 7 requests × 200ms = 1.4s. 1 combined request = 200ms. |
| `branch_id: user?.branch_id ?? 1` | Owner has null branch. Must send branch_id explicitly for sales. |

---

*Generated from Restaurant OS build session — Phases 1–7 backend + Phases 1–3 frontend.*
