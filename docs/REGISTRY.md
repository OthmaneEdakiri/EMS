# API Route Registry

Base path: `/api/v1/...`

| Method | Endpoint | Controller (proposed) | FR | Status |
|--------|----------|----------------------|-----|--------|
| **Auth** | | | |
| POST | `/register` | `Auth\RegisteredUserController@register` | FR-1 | ✅ |
| POST | `/login` | `Auth\AuthController@store` | FR-2 | ✅ |
| POST | `/logout` | `Auth\AuthController@destroy` | — | ✅ |
| GET | `/user` | Closure (returns `$request->user()`) | — | ✅ |
| POST | `/password/change` | `Auth\PasswordChangeController@store` | FR-3 | ✅ |
| **Team** | | | |
| GET | `/users` | `Auth\StaffController@index` | FR-3 | ✅ |
| POST | `/users` | `Auth\StaffController@store` | FR-3 | ✅ |
| DELETE | `/users/{user}` | `Auth\StaffController@destroy` | FR-3 | ✅ |
| **Customers** | | | |
| GET | `/customers` | `CustomerController@index` | FR-4 | ✅ |
| POST | `/customers` | `CustomerController@store` | FR-4 | ✅ |
| GET | `/customers/{customer}` | `CustomerController@show` | FR-4 | ✅ |
| PATCH | `/customers/{customer}` | `CustomerController@update` | FR-4 | ✅ |
| DELETE | `/customers/{customer}` | `CustomerController@destroy` | FR-4 | ✅ |
| **Products** | | | |
| GET | `/products` | `ProductController@index` | FR-5 | ✅ |
| POST | `/products` | `ProductController@store` | FR-5 | ✅ |
| GET | `/products/{product}` | `ProductController@show` | FR-5 | ✅ |
| PATCH | `/products/{product}` | `ProductController@update` | FR-5 | ✅ |
| DELETE | `/products/{product}` | `ProductController@destroy` | FR-5 | ✅ |
| **Invoices** | | | |
| GET | `/invoices` | `InvoiceController@index` | FR-9 | ✅ |
| POST | `/invoices` | `InvoiceController@store` | FR-6 | ✅ |
| GET | `/invoices/{invoice}` | `InvoiceController@show` | FR-6 | ✅ |
| PATCH | `/invoices/{invoice}` | `InvoiceController@update` | FR-6 | ✅ |
| DELETE | `/invoices/{invoice}` | `InvoiceController@destroy` | FR-6 | ✅ |
| POST | `/invoices/{invoice}/send` | `InvoiceController@send` | FR-6, **FR-11 (v2)** | ⚠️ Modify (v2) |
| POST | `/invoices/{invoice}/cancel` | `InvoiceController@cancel` | §8, **FR-12 (v2)** | ⚠️ Modify (v2) |
| GET | `/invoices/{invoice}/pdf` | `InvoiceController@downloadPdf` | FR-7 | ✅ |
| **Payments** | | | |
| POST | `/invoices/{invoice}/payments` | `PaymentController@store` | FR-8 | ✅ |
| **Stock & Inventory (v2 — new)** | | | |
| PATCH | `/products/{product}/stock/enable` | `StockController@enable` | FR-10 | ❌ |
| POST | `/products/{product}/stock/adjustments` | `StockAdjustmentController@store` | FR-13 | ❌ |
| GET | `/products/{product}/stock/movements` | `StockMovementController@index` | §4 Feature 2 | ❌ |
| GET | `/stock` | `StockReportController@index` | FR-14, FR-15 | ❌ |
| **Tenant Settings (v2 — extended)** | | | |
| GET | `/tenant/settings` | `TenantSettingsController@show` | FR-16 (extends v1) | ❌ |
| PATCH | `/tenant/settings` | `TenantSettingsController@update` | FR-16 | ❌ |

**Status:** ✅ = Implemented, ❌ = Not yet implemented, ⚠️ Modify (v2) = existing v1 endpoint, behavior extended per v2 PRD §13

---

## Notes on the v2 Update (Inventory & Stock Management)

- **Brand-new routes (6):** four under `/products/{product}/stock/*` and `/stock`, plus `GET/PATCH /tenant/settings` (the latter extends a tenant setting that already existed in v1, but wasn't previously registered here as its own route).
- **Modified, not new, routes (2):** `POST /invoices/{invoice}/send` and `POST /invoices/{invoice}/cancel` — same controller and endpoint as v1, but the internal logic changes substantially (row locking + quantity aggregation + atomic stock deduction/restoration, see FR-11 and FR-12). The same row was kept in the table, with status marked ⚠️ instead of creating a duplicate row.
- **Write permissions:** all `stock/enable`, `stock/adjustments`, and `PATCH /tenant/settings` actions are **Owner-only**; Staff is read-only (`GET`).
- **API prefix:** stays `/api/v1/...` as-is — the API version has no relation to the product's phase number (v2), as explicitly stated in PRD §13.