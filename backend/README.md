# EMS Backend

ERP SaaS Platform for SMBs — Laravel API

## Tech Stack

- **Framework:** Laravel 11
- **Database:** PostgreSQL
- **Auth:** Laravel Sanctum
- **Testing:** PHPUnit

## Getting Started

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## Running Tests

```bash
php artisan test
```

Code style:

```bash
vendor/bin/pint
```

## API

All endpoints are prefixed with `/api/v1/` and require a Sanctum bearer token.

## Sprint 6 — Inventory & Stock Management (v2)

### New Endpoints

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| PATCH | `/api/v1/products/{id}/stock/enable` | Enable stock tracking + set opening quantity | Owner only |
| POST | `/api/v1/products/{id}/stock/adjustments` | Manual stock adjustment (new quantity or delta) | Owner only |
| GET | `/api/v1/settings/company` | Read tenant settings (incl. oversell_policy) | All authenticated users |
| PATCH | `/api/v1/settings/company` | Update tenant settings (incl. oversell_policy) | Owner only |

### Known Limitations (Sprint 6)

These are documented per PRD v2 §17:

1. **`quantity_on_hand` is a cached value.** If it ever drifts from the sum of `stock_movements` (e.g., due to a bug or manual DB edit), there is only a manual "recalculate" action, not automatic reconciliation. A test asserts the cached value always matches the ledger sum after each operation.

2. **Whole-number quantities only.** No fractional units (kg, liters). Flag before onboarding any pilot tenant that sells by weight/volume.

3. **No stock reservation on draft invoices.** Two staff can draft against the same last unit; only the first to *send* wins (by design). This can surprise a user who drafted first and sends second.

4. **Manual adjustments have no approval workflow.** Any Owner can adjust stock to any value with just a free-text reason. Acceptable at pilot scale; revisit if a tenant has multiple Owners.

5. **No low-stock notifications.** Badge is visible only when a user is actively looking at the product or stock list.

6. **Single implicit location per tenant.** No support for "stock at Warehouse A vs Store B."

7. **Oversell policy is tenant-wide only.** A tenant that wants "block for high-value items, warn for the rest" has no way to express that in v2.
