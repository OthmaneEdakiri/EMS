# Product Requirements Document (PRD)
## ERP SaaS Platform for SMBs — MVP (v1)

| | |
|---|---|
| **Document Owner** | Product/Engineering |
| **Status** | Draft v1.0 |
| **Last Updated** | 2026-07-11 |
| **Tech Stack** | Laravel (PHP) · PostgreSQL · Next.js · ShadCN/ui |
| **Team assumption** | Solo developer / very small team |

---

## 1. Overview

### 1.1 Problem Statement
SMBs currently rely on spreadsheets or disconnected tools to quote customers, invoice them, and track whether they got paid. There is no fast, affordable, cloud-based way to do just that — most ERPs make you buy the whole suite before you've proven the core loop works for you.

### 1.2 What "MVP" Means Here
**The MVP answers one question only: can a business create a customer, invoice them, and record that they got paid — faster and more reliably than a spreadsheet?**

Anything that isn't required to answer "yes" to that question is **not MVP**, no matter how standard it is in a "real ERP."

### 1.3 Goals (MVP)
- Ship the smallest system that lets one business fully replace their invoicing spreadsheet.
- Get to a working, demoable product in **weeks, not months**, for a solo/small team.
- Validate the core loop with 5–10 real pilot users before building anything else.

### 1.4 Explicitly Out of Scope for MVP
- **Team invite-by-email flow** — Owner creates Staff accounts directly (see FR-3, revised)
- Accounting (double-entry, journals, fiscal periods, reports) — deferred to V3
- Inventory/stock tracking — deferred to V1
- Purchasing / suppliers — deferred to V2
- SaaS billing automation (Stripe/Cashier, trials, plans) — deferred; handle manually at pilot stage
- Notifications (email/in-app) — deferred
- Dashboard / KPIs / charts — deferred
- Full audit log — replaced with `created_by`/`updated_by`/timestamps
- Queues, background jobs, Redis, Horizon — deferred; PDF generation is synchronous for MVP
- PostgreSQL Row-Level Security — deferred; `tenant_id` + application-level global scope is sufficient for MVP
- Domain events architecture — deferred; direct, simple controller/service logic for MVP
- Multi-warehouse, multi-currency, HR/Payroll, Manufacturing, native mobile apps

---

## 2. Target Users & Personas (MVP-relevant only)

| Persona | Role | Key Need in MVP |
|---|---|---|
| **Owner/Manager (Admin)** | Business owner, 1–20 employees | Create invoices, see who's paid and who hasn't, create Staff accounts as needed |
| **Sales/Front Office User (Staff)** | Sales rep, cashier | Create quotes/invoices fast |

---

## 3. Success Metrics (MVP)

| Metric | Target |
|---|---|
| Time to first invoice issued (signup → invoice) | < 10 minutes |
| Pilot users who create ≥1 real invoice in week 1 | ≥ 60% of pilot group |
| Pilot users who say "I'd keep using this instead of my spreadsheet" | ≥ 50% |
| Time to build MVP (solo dev, focused) | 4–5 weeks (down from 4–6 after removing invite flow) |

---

## 4. MVP Scope — Feature List

| # | Feature | Why it's in MVP |
|---|---|---|
| 1 | Multi-tenant signup & login | Every tenant needs isolated data from day one — structural, not optional |
| 2 | Users & simple roles (Owner creates Staff directly — no email invite) | Minimum needed so an owner isn't the only login |
| 3 | Customers (CRUD) | Can't invoice without a customer |
| 4 | Products & Services (CRUD, `type` field, no stock tracking) | Priced items for invoice lines |
| 5 | Invoices (create, send, PDF) | The core deliverable |
| 6 | Payments (record against invoice) | Closes the loop: did we get paid? |
| 7 | created_by/updated_by + timestamps | Minimum accountability, not a full audit trail |

---

## 5. User Flows

### 5.1 Primary Flow — Core Loop
```
Signup (creates tenant + owner user)
        │
        ▼
Onboarding: set company name, currency, invoice prefix
        │
        ▼
Add first Product or Service (name + type + price)
        │
        ▼
Add first Customer
        │
        ▼
Create Invoice (select customer, add line items, save)
        │
        ▼
Send Invoice (download PDF / mark as sent)
        │
        ▼
Record Payment (mark invoice paid/partially paid)
        │
        ▼
View Invoice List (filter by status)
```

### 5.2 Secondary Flow — Team Access (revised, simplified)
```
Owner logs in
        │
        ▼
Owner goes to Team Settings → "Add User"
        │
        ▼
Owner enters name, email, temporary password, role = Staff
        │
        ▼
Owner shares credentials with the Staff member directly (out of band —
no system email required for MVP)
        │
        ▼
Staff logs in, is prompted to change password on first login
```
*No invite token, no email delivery dependency, no "pending invite" state to manage in MVP.*

---

## 6. Functional Requirements & Acceptance Criteria

### FR-1: Tenant Signup
- **Given** a visitor on the signup page
  **When** they submit a valid email, password, and company name
  **Then** a new tenant is created, an Owner user is created and linked to it, and they are logged in and redirected to onboarding.
- **Given** an email that's already registered
  **When** they try to sign up with it
  **Then** they see a clear error and a link to log in instead.

### FR-2: Login
- **Given** a registered user
  **When** they submit correct email/password
  **Then** they are authenticated (Sanctum token/session) and land on the invoice list (or onboarding if no invoices exist yet).

### FR-3: Create Staff User (revised — no email invite)
- **Given** an Owner on the Team Settings page
  **When** they enter a name, email, and a temporary password, and select role "Staff"
  **Then** a new user is created immediately under their tenant, active and ready to log in — no email is sent, no invite/accept step exists.
- **Given** a new Staff user logging in for the first time
  **When** they authenticate with the temporary password
  **Then** they are required to set a new password before accessing anything else.
- **Given** a Staff user
  **When** they attempt to access Team/User settings
  **Then** they are denied (403) — Staff can manage Customers/Products/Invoices/Payments only.

### FR-4: Manage Customers
- **Given** a logged-in user (Owner or Staff)
  **When** they create a customer with a name (required) and optional tax ID/email/phone/address
  **Then** the customer is saved and scoped to their tenant only.

### FR-5: Manage Products & Services
- **Given** a logged-in user
  **When** they create an item with a name (required), `type` (`product` or `service`, required), and unit price (required)
  **Then** it becomes selectable in invoice line items.
- Note: `type` exists in MVP purely as a data field for future filtering/reporting — it has **no behavioral difference** yet (e.g., services will never have stock tracking; products will, starting V1).

### FR-6: Create Invoice
- **Given** a logged-in user creating an invoice
  **When** they select a customer, add ≥1 line item (product/service, quantity, unit price pre-filled/editable, tax rate optional per line, defaults to the tenant's default rate but can be set to 0%), and save
  **Then** the system calculates subtotal, tax (exclusive — added on top of the line price, not included in it), and total; assigns a sequential invoice number per tenant (e.g., `INV-0001`, zero-padded, **numbers are never reused** even if the invoice is later deleted or cancelled); and sets status to `draft`.
- **Given** a draft invoice
  **When** the user clicks "Mark as Sent"
  **Then** status changes to `sent` and a PDF becomes downloadable. Once `sent`, the invoice becomes **read-only for line items** (see §8 Business Rules).

### FR-7: Generate Invoice PDF
- **Given** a saved invoice
  **When** the user clicks "Download PDF"
  **Then** a PDF is generated synchronously using the tenant's company name/logo (if uploaded) and returned within 3 seconds for a typical invoice (<20 line items).

### FR-8: Record Payment
- **Given** an invoice with status `sent` or `partially_paid`
  **When** the user records a payment (amount, method, date)
  **Then** the system updates status to `paid` (if amount = balance due) or `partially_paid` (if less), and stores the payment record.
- **Given** a payment amount greater than the balance due
  **When** the user attempts to save it
  **Then** the system rejects it with a validation error (see Business Rules §8).

### FR-9: Invoice List & Filtering
- **Given** a user on the invoice list page
  **When** they filter by status (`draft`/`sent`/`partially_paid`/`paid`/`overdue`/`cancelled`)
  **Then** the list updates accordingly, sorted by date descending by default.
- **Given** an invoice past its due date with an unpaid balance
  **When** the list is rendered
  **Then** its status is computed/displayed as `overdue` (derived, not a stored separate state — `cancelled` and `paid` invoices are never shown as `overdue` regardless of date).

---

## 7. Non-Functional Requirements (MVP-scoped)

| Category | Requirement |
|---|---|
| **Multi-tenancy** | PostgreSQL, shared schema, `tenant_id` column on every business table + Laravel global Eloquent scope. No RLS in MVP. |
| **Security** | Passwords hashed (bcrypt); every tenant-scoped query goes through the global scope; role checks via simple `role` enum column on `users` (Owner/Staff). |
| **Localization** | Arabic + English UI strings, RTL layout support in Next.js from day one. |
| **Performance** | Page loads < 2s on typical broadband; PDF generation < 3s synchronous. |
| **Data integrity** | `created_by`, `updated_by`, `created_at`, `updated_at` on all tables including `invoice_lines`. No hard deletes on invoices/customers/products (soft delete only). |
| **Currency** | Store amounts as integer minor units (cents) where the currency supports decimals; store a `decimal_places` value per currency (2 for MAD/EUR/USD, 0 for JPY) so future multi-currency support doesn't require a data migration. For MVP, only one currency per tenant, set at onboarding — but store it correctly from day one. |
| **Deployment** | Laravel API + Next.js frontend, both deployable as simple containers or PaaS — no Redis/queue infra required for MVP. |

---

## 8. Business Rules

These rules exist specifically to remove ambiguity during implementation — they are binding constraints, not suggestions.

### Invoice
- A `paid` invoice **cannot be edited** (no line item, customer, or amount changes) — only viewed, downloaded as PDF, or refunded via a future credit-note feature (post-MVP).
- A `sent` invoice **cannot have its line items edited or deleted** — only its status can move forward (`sent` → `partially_paid` → `paid`, or `sent` → `cancelled`).
- A `draft` invoice can be freely edited or deleted (hard delete allowed only while `draft`, since no payment or PDF history exists yet).
- Cancelling an invoice: allowed only from `draft` or `sent` (not `paid` or `partially_paid` — a payment must be handled before cancellation). Cancelled invoices are excluded from `overdue` calculations and revenue-adjacent totals.
- Invoice numbers are **immutable and never reused**, even if the invoice is deleted while still a draft.

### Customer
- A customer **cannot be deleted** if they have any invoices (draft or otherwise) linked to them. The UI must offer "Archive" instead — an archived customer is hidden from the "new invoice" picker but historical invoices remain intact.

### Product/Service
- A product/service is **never hard-deleted** if it has been used on any invoice line. "Delete" in the UI performs a soft delete (`archived = true`); archived items are hidden from the picker on new invoices but remain visible/intact on historical invoice lines.
- A product/service with zero usage history can be hard-deleted.

### Payment
- The sum of all payments recorded against an invoice can never exceed the invoice total — enforced at the database/service layer, not just the frontend.
- When the sum of payments equals the invoice total, status automatically becomes `paid`.
- A payment **cannot be deleted** once recorded (financial record integrity) — if a payment was recorded in error, it must be corrected via a reversal/negative adjustment (deferred detail to V3 Accounting; for MVP, simply disallow deletion and document this limitation).

---

## 9. Error States

Explicitly documented so they aren't "discovered" as bugs during implementation:

| Action | System Behavior |
|---|---|
| Delete a customer with existing invoices | Blocked; UI shows "This customer has N invoice(s) and cannot be deleted — archive instead." |
| Delete a product/service used in an invoice | Blocked from hard delete; system performs soft delete (archive) instead, transparently to the user if they click "Delete" — UI copy clarifies it will be archived, not erased. |
| Edit a `paid` invoice | Blocked; edit controls are disabled/hidden in the UI, and the API rejects the request (422) if attempted directly. |
| Edit line items on a `sent` (unpaid) invoice | Blocked; same as above — status must be reverted conceptually via cancellation + new draft, not in-place editing. |
| Delete a payment | Blocked entirely in MVP; UI does not expose a delete action for payments. |
| Record a payment exceeding balance due | Blocked with a validation error showing the exact remaining balance. |
| Two users edit the same draft invoice simultaneously | Last write wins for MVP (no optimistic locking) — documented as a known limitation in §12, not solved in MVP. |

---

## 10. UX Requirements

| Requirement | Detail |
|---|---|
| Invoice creation speed | ≤ 4 clicks from invoice list to a saved draft with 1 line item |
| Product search in invoice line | Type-ahead search (ShadCN Command), no full page navigation |
| Keyboard flow | Tab order allows adding a full invoice line without touching the mouse |
| RTL | Full mirrored layout in Arabic, tested with real Arabic content |
| Empty states | Every list (customers, products, invoices) has a clear empty state with a CTA |

---

## 11. Technical Architecture (MVP-simplified)

```
Next.js (App Router) + ShadCN/ui  ──HTTPS/JSON──▶  Laravel API (Sanctum auth)
                                                          │
                                                          ▼
                                                 PostgreSQL (tenant_id + global scope)
```

No queue, no Redis, no Horizon, no event bus, no RLS, no Stripe integration in MVP.

### 11.1 Backend (Laravel)
- **Auth:** Laravel Sanctum (SPA-mode token auth)
- **Authorization:** simple `role` enum on `users` table (`owner`, `staff`) checked via Laravel Policies/Gates
- **Multi-tenancy:** `tenant_id` on every table + a `BelongsToTenant` trait applying a global scope automatically
- **PDF:** `barryvdh/laravel-dompdf`, called synchronously in the request/response cycle
- No system email is required for MVP (invite flow removed) — email sending can be entirely deferred until a real notification need emerges (V4).

### 11.2 Frontend (Next.js + ShadCN)
- ShadCN DataTable for invoice/customer/product lists
- ShadCN Form + Zod for invoice creation (dynamic line items)
- `next-intl` for ar/en + RTL from day one

---

## 12. Data Model — MVP Only

```
tenants (id, name, currency, currency_decimal_places, locale, invoice_prefix, created_at)
users (id, tenant_id, name, email, password, role, must_change_password, created_at, updated_at)
customers (id, tenant_id, name, tax_id, email, phone, address, archived_at, created_by, updated_by, created_at, updated_at, deleted_at)
products (id, tenant_id, type, name, unit_price, tax_rate, archived_at, created_by, updated_by, created_at, updated_at, deleted_at)
invoices (id, tenant_id, customer_id, number, status, issue_date, due_date, subtotal, tax_total, total, cancelled_at, created_by, updated_by, created_at, updated_at, deleted_at)
invoice_lines (id, invoice_id, product_id, description, qty, unit_price, tax_rate, line_total, created_at, updated_at)
payments (id, tenant_id, invoice_id, amount, method, paid_at, created_by, created_at)
```

Notes:
- `products.type` — enum `product` / `service`, no behavioral impact in MVP, prevents a future migration.
- `invoices.number` — unique per tenant, generated from a per-tenant counter that only increments, never reused.
- `invoices.status` — enum: `draft`, `sent`, `partially_paid`, `paid`, `cancelled` (`overdue` is computed, not stored).
- `products.archived_at` / `customers.archived_at` — soft "hide from picker" flag, distinct from `deleted_at` (hard delete only allowed pre-usage).

---

## 13. API Conventions

All MVP endpoints follow this convention — documented once here rather than repeated per feature.

**Base path:** `/api/v1/...`

| Verb | Path | Purpose |
|---|---|---|
| GET | `/api/v1/invoices` | List (paginated, filterable by `status`) |
| GET | `/api/v1/invoices/{id}` | Show single |
| POST | `/api/v1/invoices` | Create (status defaults to `draft`) |
| PATCH | `/api/v1/invoices/{id}` | Update (blocked server-side per Business Rules §8 based on status) |
| DELETE | `/api/v1/invoices/{id}` | Delete (only allowed while `draft`) |
| POST | `/api/v1/invoices/{id}/send` | Transition `draft` → `sent` |
| POST | `/api/v1/invoices/{id}/cancel` | Transition → `cancelled` |
| GET | `/api/v1/invoices/{id}/pdf` | Stream PDF |
| POST | `/api/v1/invoices/{id}/payments` | Record a payment |

Same CRUD pattern applies to `/customers`, `/products`, `/users`.

**Standard response envelope:**
```json
{
  "data": {},
  "meta": {},
  "errors": []
}
```

**Standard error response (validation, 422):**
```json
{
  "data": null,
  "meta": {},
  "errors": [
    { "field": "amount", "message": "Payment exceeds remaining balance of 150.00" }
  ]
}
```

---

## 14. Design Guidelines (stub — expand before Sprint 1 frontend work)

A one-page reference to keep ShadCN usage consistent, to be filled in before frontend work starts:
- **Primary action button** — one consistent variant/color for "Save," "Create Invoice," etc.
- **Destructive action button** — distinct variant for Delete/Cancel/Archive actions, always paired with a confirmation dialog.
- **Form layout/spacing** — consistent field spacing, label position (top-aligned, works better for RTL mirroring than inline labels).
- **Empty states** — consistent icon + message + CTA pattern reused across Customers/Products/Invoices lists.
- **Status badges** — one color mapping for invoice statuses (`draft`=gray, `sent`=blue, `partially_paid`=amber, `paid`=green, `overdue`=red, `cancelled`=muted/strikethrough), used consistently in list and detail views.

*(This is intentionally a stub — the point is to force these decisions once, in one place, rather than ad hoc per screen.)*

---

## 15. Roadmap — Sprint Plan (Solo Developer)

Assumes a solo developer working focused, full-time. Each sprint = 1 week. Adjust ×2 if part-time.

| Sprint | Scope |
|---|---|
| **Sprint 1** | Laravel + Next.js scaffolding, tenant + user tables, Sanctum auth, signup/login flow, Design Guidelines stub filled in |
| **Sprint 2** | Owner-creates-Staff flow (no email), Customers CRUD (backend + frontend incl. archive logic) |
| **Sprint 3** | Products/Services CRUD (with `type` field), Invoice creation (line items, totals, numbering, business rules enforced) |
| **Sprint 4** | Invoice PDF generation, status transitions (send/cancel), invoice list + filters, error states from §9 |
| **Sprint 5** | Payments (record, partial/paid logic, overdue derivation, balance validation), polish, pilot onboarding |

**→ MVP demoable/usable at end of Sprint 5** (one sprint earlier than v2, due to removing the invite flow).

### Post-MVP Versions
| Version | Scope | Trigger to start |
|---|---|---|
| **V1** | Inventory (stock tracking on products, stock movements from invoices) | Pilot users ask "can it track my stock?" |
| **V2** | Purchasing (suppliers, POs, goods receipt) | Pilot users need to track what they buy, not just sell |
| **V3** | Accounting (chart of accounts, auto journal entries, P&L/Balance Sheet) — treat as its own mini-project | You have paying customers who need books, or bring in an accountant to help design it correctly |
| **V4** | SaaS billing automation, email invites/notifications, Dashboard, Queue/Horizon, fuller audit log, RLS (if compliance demands it), payment reversal/credit-note support | You're past pilot and onboarding customers self-serve |

---

## 16. Definition of Done (DoD)

A feature is not "done" until **all** of the following are true — this applies to every feature in §4/§6, tracked per sprint:

- [ ] Backend implemented (endpoint, validation, business rules from §8 enforced server-side, not just frontend)
- [ ] Frontend implemented and wired to the real API (no mock data left in place)
- [ ] Authorization checked (Owner vs. Staff, tenant scoping verified — not just assumed)
- [ ] Error states from §9 handled with real UI feedback, not silent failures
- [ ] At least one automated test covering the core happy path and one business rule (e.g., "payment cannot exceed balance")
- [ ] RTL layout verified with real Arabic content
- [ ] Both English and Arabic strings present (no hardcoded English left in a translation-key component)
- [ ] Responsive on mobile viewport (even if desktop-first, it must not break)
- [ ] No errors/warnings in browser console
- [ ] Brief note added to README (what it does, any known limitation from §12 that applies)

---

## 17. Technical Debt & Known Limitations (tracked intentionally)

- No RLS — tenant isolation relies entirely on the application-level global scope. **Mitigation:** code review checklist item + a test asserting cross-tenant queries return empty.
- No queue — PDF generation blocks the request. Fine at low volume.
- No optimistic locking on concurrent edits — last write wins (§9).
- Payments cannot be deleted/reversed in MVP — a data-entry mistake requires a manual workaround until V3/V4 introduces reversal support.
- Role model is a simple enum, not a permission matrix — fine for 2 roles, revisit at V1+ if roles multiply.
- No full audit trail — only `created_by`/`updated_by`. Flag before onboarding any pilot customer with compliance needs.
- No system email in MVP — Staff onboarding is fully manual (Owner shares credentials out of band). Acceptable at pilot scale (a handful of users per tenant), revisit at V4.

---

## 18. Open Questions
- Target market/geography — affects default tax rate, currency, and locale defaults?
- Confirm: exclusive tax display is acceptable for the target market, or does any pilot customer expect inclusive pricing (common in some retail contexts)?
- Manual billing process for pilot tenants: invoice them manually, or is a simple Stripe Payment Link acceptable without full Cashier integration?
- Any pilot customer with a hard compliance requirement (full audit trail, RLS, payment reversal) that should be flagged *before* onboarding, given §17's known limitations?

---

## 19. Appendix — Full Post-MVP Backlog (unordered)
- Multi-warehouse inventory
- Multi-currency
- HR & Payroll
- Manufacturing / BOM / Work Orders
- Advanced CRM (pipeline, marketing automation)
- Recurring invoices/subscriptions for end-customers
- Public REST API for third-party integrations
- Advanced BI/custom report builder
- Native mobile apps
- Full permission-matrix RBAC
- Domain event-driven architecture (once module count justifies decoupling)
- Email invite flow for team members
- Payment reversal / credit notes
- Optimistic locking for concurrent edits
