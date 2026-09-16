# Product Requirements Document (PRD)
## ERP SaaS Platform for SMBs — v2: Inventory & Stock Management

| | |
|---|---|
| **Document Owner** | Product/Engineering |
| **Status** | Draft, Rev 2 (versioning corrected per review) |
| **Builds On** | v1 / MVP — Customers + Products + Invoices + Payments — assumed fully implemented and in pilot use |
| **Last Updated** | 2026-09-16 |
| **Tech Stack** | Laravel (PHP) · PostgreSQL · Next.js · ShadCN/ui |
| **Team assumption** | Solo developer / very small team |

**Versioning scheme used from this point forward:**

| Version | Scope |
|---|---|
| **v1 (MVP)** | Customers + Products + Invoices + Payments — live, baseline |
| **v2 (this document)** | Inventory & Stock Management |
| **v3** | Purchasing (suppliers, POs, goods receipt) |
| **v4** | Accounting (chart of accounts, journal entries, valuation, statements) |
| **v5** | SaaS billing automation, email/notifications, Dashboard, Queue/Horizon, fuller audit log, RLS, credit notes, fractional quantities |

**Changelog, Rev 1 → Rev 2:** the previous draft internally labeled this phase "V1" while the document itself was versioned "v2.x" — a confusing double meaning where "V1" meant two different things depending on which part of the document you were reading. This revision removes that ambiguity: the MVP is **v1**, this Inventory document is **v2** throughout, and every downstream phase is renumbered accordingly (Purchasing v2→v3, Accounting v3→v4, SaaS billing/notifications v4→v5). No functional or business-rule content changed from the prior revision — this is a naming/labeling fix only, applied consistently across every section, FR, and cross-reference.

---

## 0. Baseline — What Already Exists (v1 / MVP)

This document assumes **v1 (MVP)** is live and in use by pilot tenants, with the following already shipped and **not re-specified here**:

- Multi-tenant signup/login, Owner + Staff roles (no email invite)
- Customers CRUD (archive, not delete, when referenced)
- Products & Services CRUD, with a `type` field (`product`/`service`) that had **no behavioral effect** in v1
- Invoices: create, line items, PDF, status lifecycle (`draft → sent → partially_paid/paid`, `cancelled`), immutable sequential numbering
- Payments: record against invoice, cannot exceed balance, cannot be deleted
- `created_by`/`updated_by`/timestamps only — no full audit trail
- No queue, no RLS, no email sending, no Stripe/Cashier

Everything below is **new** scope layered on top of v1. Nothing in §0 is being redesigned — only extended.

---

## 1. Overview

### 1.1 Problem Statement (v2)
Pilot feedback on v1 consistently surfaces one gap: businesses selling physical `product`-type items have no way to know how much stock they have left. They're back to a spreadsheet — this time to track quantity instead of payment status. The `type` field from v1 exists specifically to make this extension possible without a schema migration.

### 1.2 What "v2" Means Here
**v2 answers one additional question: can a business know, at any moment, how much of a product they have left — and does creating/sending an invoice for a product automatically reduce that number, correctly and exactly once?**

v2 does **not** attempt to answer "what should I reorder and from whom" (that's **v3** — Purchasing) or "what is my inventory worth on my books" (that's **v4** — Accounting). It is deliberately just: track quantity, deduct on sale, prevent overselling, allow controlled manual correction.

### 1.3 Goals (v2)
- Give `product`-type items a real, trustworthy on-hand quantity.
- Automatically and atomically deduct stock when a sale is committed (invoice sent), with no double-deduction and no silent overselling.
- Allow manual stock corrections (receiving initial stock, counts, damage/loss) under a single, consistent permission model — before Purchasing (v3) exists to do this properly.
- Do all of this without breaking anything already live for pilot tenants — this is an additive migration, not a rewrite.

### 1.4 Explicitly Out of Scope for v2
- Purchasing / suppliers / purchase orders / goods receipt — deferred to **v3**
- Multi-warehouse / multi-location stock — deferred (single implicit "default location" per tenant in v2)
- Inventory valuation methods (FIFO/LIFO/weighted average) and accounting integration — deferred to **v4**
- Stock reservations for `draft` invoices/quotes — a draft does **not** reserve stock (see §8 Business Rules)
- Barcode scanning, batch/lot tracking, serial numbers, expiry dates
- Automatic reorder suggestions/alerts beyond a simple low-stock badge
- Email/notification-based low-stock alerts (still no system email until **v5**)
- Per-product override of the oversell policy — v2 ships **tenant-level only** (see §6 FR-16, decided; no longer an open question)

---

## 2. Target Users & Personas (v2-relevant only)

| Persona | Role | New Need in v2 |
|---|---|---|
| **Owner/Manager (Admin)** | Business owner | See current stock per product; the **sole role** that can write to stock — enabling tracking with an opening balance, adjusting quantities, and configuring the tenant's oversell policy |
| **Sales/Front Office User (Staff)** | Sales rep, cashier | See available stock and low-stock badges while building an invoice; be blocked (or warned, per tenant policy) before overselling — **read-only** with respect to stock everywhere except the normal sell-via-invoice flow |

**Permission model, stated once here:** any action that changes `quantity_on_hand` outside of the automatic sale/cancellation flow — enabling tracking with an opening balance, or adjusting a quantity — is **Owner-only**. Staff can trigger stock changes only indirectly, by sending an invoice (FR-11) or triggering its cancellation reversal (FR-12), both of which are system-computed, not manually entered numbers.

---

## 3. Success Metrics (v2)

| Metric | Target |
|---|---|
| Pilot tenants with ≥1 `product`-type item who enable stock tracking within 1 week of release | ≥ 70% |
| Stock discrepancy reports (tenant says on-hand number is wrong) in first month | < 5% of tracked products |
| Products left with negative `quantity_on_hand` **without** the tenant's oversell policy explicitly set to "warn" (an unintended negative-stock state, queryable directly from the database) | 0, in the first month |
| Time to build v2 (solo dev, focused, on top of live v1) | 2–3 weeks |

---

## 4. v2 Scope — Feature List

| # | Feature | Why it's in v2 |
|---|---|---|
| 1 | `track_stock` flag + `quantity_on_hand` on products | Opt-in per product; `service`-type items are never stock-tracked |
| 2 | Stock movement ledger (`stock_movements` table) | Every quantity change must be explainable and reversible-by-audit, not just a number that silently changes |
| 3 | Enable tracking + manual stock adjustment (Owner only, single permission model) | Set opening balances, correct counts, record damage/loss — before Purchasing (v3) exists |
| 4 | Automatic, idempotent deduction on invoice send | Closes the loop: selling a tracked product reduces what's left, exactly once even on retry |
| 5 | Tenant-level oversell policy (block or warn), stored and editable | Prevents promising stock that doesn't exist, or explicitly allows it — a real, persisted setting |
| 6 | Stock restoration on cancellation | An invoice that's cancelled after being sent must give stock back |
| 7 | Low-stock indicator (reorder threshold) | Minimum viable "should I worry about this" signal, no notifications required |
| 8 | Current Stock list/report | Read-only view answering "what do I have right now" |
| 9 | Product-type immutability once stock-tracked | Prevents silently discarding a quantity history via a `product → service` type change |

---

## 5. User Flows

### 5.1 New Flow — Enable Tracking & Set Opening Stock (Owner-only)
```
Owner opens an existing `product`-type item
        │
        ▼
Toggles "Track stock" on
        │
        ▼
Enters opening quantity (required once, becomes a
`stock_movements` row of type `opening_balance`) — this is a
one-time, forward-looking starting point; v2 does not attempt to
reconstruct stock history from invoices issued before v2 existed
(decided — see FR-10)
        │
        ▼
Optionally sets a reorder threshold (≥ 0)
        │
        ▼
Product now shows quantity_on_hand everywhere it's listed
```
*A product created fresh can enable tracking + set opening stock (default 0) in the same create form — no two-step flow required. Staff never sees this control; if a Staff user needs a product tracked, they ask the Owner, same as they already do for Team Settings in v1.*

### 5.2 Modified Flow — Invoice → Stock Deduction (extends v1 §5.1)
```
Invoice line items added (product may be stock-tracked, and may
appear on more than one line — see §8 "Line Aggregation")
        │
        ▼
While still `draft`: stock is NOT reserved or deducted —
available quantity shown for reference only
        │
        ▼
User clicks "Mark as Sent"
        │
        ▼
System locks the invoice row, confirms it is still `draft`
(guards against a double-click / retry re-triggering this flow),
then aggregates quantities per product_id across all lines
        │
        ▼
For each distinct tracked product: lock the product row
(SELECT ... FOR UPDATE), check aggregated quantity against
quantity_on_hand
        │
        ├─ Sufficient stock (or policy = warn) ──▶ Deduct, write
        │                                          ONE `sale`
        │                                          movement row per
        │                                          product for this
        │                                          invoice, proceed
        │                                          to `sent`
        │
        └─ Insufficient stock AND policy = block ─▶ Whole send
                                                     rejected, no
                                                     partial deduction
        │
        ▼
If a `sent` invoice is later cancelled: stock is restored
(`cancellation_reversal` movement rows), invoice → `cancelled`
```

### 5.3 New Flow — Manual Stock Adjustment (Owner-only)
```
Owner opens a tracked product → "Adjust Stock"
        │
        ▼
Enters new quantity OR a +/- delta, and a required reason
(free text — e.g. "physical count", "damaged", "opening balance")
        │
        ▼
System writes a `stock_movements` row (type = `adjustment`),
recalculates quantity_on_hand
```

### 5.4 New Flow — Configure Oversell Policy (Owner-only, one-time/rare)
```
Owner opens Tenant/Company Settings (same settings area v1
already uses for currency/invoice prefix)
        │
        ▼
Selects oversell policy: "Block sales that exceed stock"
(default) or "Allow, but show a warning"
        │
        ▼
Setting is saved on the tenant record and applies to every
tracked product for that tenant — no per-product override in v2
```

---

## 6. Functional Requirements & Acceptance Criteria

### FR-10: Enable Stock Tracking on a Product (Owner-only)
- **Given** a `product`-type item (not `service`)
  **When** an **Owner** toggles "Track stock" on for the first time and supplies an opening quantity (≥ 0)
  **Then** a `stock_movements` row of type `opening_balance` is created and `quantity_on_hand` is set accordingly.
- **Given** a Staff user
  **When** they view a product's edit form
  **Then** the "Track stock" toggle and opening-quantity field are not shown, and the underlying endpoint rejects the request (403) if called directly.
- **Given** a `service`-type item
  **When** anyone views its edit form
  **Then** no "Track stock" option is shown — services are never stock-tracked in v2.
- **Decision:** enabling tracking never attempts to reconstruct historical consumption from invoices issued before v2 existed. The opening balance is simply "what the Owner counts today."

### FR-11: Invoice Send — Deduct Stock (idempotent, aggregated)
- **Given** an invoice in `draft` status containing ≥1 line item for a tracked product
  **When** the user clicks "Mark as Sent"
  **Then**, within a single database transaction: the invoice row is locked and its status re-verified as still `draft` (see idempotency note below); line items are aggregated by `product_id`; each distinct tracked product's row is locked (`SELECT ... FOR UPDATE`); the **aggregated** quantity is checked against `quantity_on_hand`; stock is deducted; **one** `stock_movements` row (type `sale`, `reference_type = invoice`, `reference_id = invoice.id`) is written per distinct product; and invoice status becomes `sent`.
- **Given** two line items on the same invoice referencing the same product
  **When** the invoice is sent
  **Then** the stock check and deduction use the **sum** of both lines' quantities, not each line checked independently — this prevents an invoice with, say, 3 + 3 units of a product with 5 in stock from incorrectly passing a per-line check.
- **Given** the tenant's oversell policy is "block" (default, see FR-16)
  **When** any tracked product's aggregated requested quantity exceeds `quantity_on_hand`
  **Then** the entire send is rejected (422) — no partial deduction — and the UI shows which product(s) are short and by how much.
- **Given** the tenant's oversell policy is "warn"
  **When** the same situation occurs
  **Then** the send proceeds, stock goes negative, and the invoice detail view shows a visible warning badge.
- **Idempotency:** if the send request is retried (network timeout, double-click, client retry) after the transaction already committed, the invoice is no longer `draft`, so the retried request is rejected as a no-op (the invoice-status check happens first, under the same row lock) rather than re-entering the deduction logic. As a second line of defense, `stock_movements` enforces a uniqueness constraint on `(reference_type, reference_id, product_id, type)` (see §12) — even in the unlikely case of two overlapping transactions both passing the status check, only one `sale` movement per product per invoice can ever be persisted; the losing transaction's insert fails and is caught, and the request returns the already-committed result rather than double-deducting.

### FR-12: Invoice Cancellation — Restore Stock
- **Given** a `sent` invoice that had stock deducted
  **When** it is cancelled (per existing v1 cancellation rule: only from `draft` or `sent`)
  **Then** for each product that had a `sale` movement on this invoice, a `stock_movements` row (type `cancellation_reversal`) restores the deducted quantity, and `quantity_on_hand` is recalculated. The same `(reference_type, reference_id, product_id, type)` uniqueness constraint prevents a duplicate reversal if cancellation is retried.

### FR-13: Manual Stock Adjustment (Owner-only)
- **Given** an Owner viewing a tracked product
  **When** they submit an adjustment with a new quantity or delta and a non-empty reason
  **Then** a `stock_movements` row (type `adjustment`) is created and `quantity_on_hand` updates immediately.
- **Given** a Staff user
  **When** they attempt to access the stock adjustment action (UI or API)
  **Then** they are denied (403) — adjustments are Owner-only, consistent with FR-10.

### FR-14: Low-Stock Indicator
- **Given** a tracked product with a `reorder_level` set (optional, default null = disabled, must be ≥ 0 when set — see §12)
  **When** `quantity_on_hand <= reorder_level`
  **Then** the product shows a low-stock badge in the product list and in the invoice line-item picker (informational only — does not block selling).

### FR-15: Current Stock List
- **Given** a logged-in user (Owner or Staff)
  **When** they open the Stock/Inventory list
  **Then** they see all tracked products with `quantity_on_hand`, `reorder_level`, and low-stock badge, filterable by "low stock only", sorted by name by default. This is read-only for both roles — no write actions live on this screen.

### FR-16: Configure Oversell Policy (Owner-only, tenant-level)
- **Given** an Owner on Tenant/Company Settings
  **When** they select "Block sales that exceed stock" or "Allow, but show a warning" and save
  **Then** the tenant's `oversell_policy` value is persisted and immediately governs every subsequent invoice-send check under FR-11, for every tracked product in that tenant.
- **Given** a newly created tenant
  **When** it is provisioned
  **Then** `oversell_policy` defaults to `block`.
- **Decision:** this setting is tenant-wide only in v2, with no per-product override — per-product override is logged in §19 as post-v2 backlog if a real need appears.

### FR-17: Product Type Immutability Once Tracked
- **Given** a product with `track_stock = true` or any `stock_movements` history
  **When** anyone attempts to change its `type` from `product` to `service` (or the reverse, for a `service` that somehow acquired tracking, which FR-10 already prevents from happening)
  **Then** the change is rejected (422) server-side, with a message explaining that stock history exists and the type is locked — mirroring the existing v1 rule that `track_stock` itself cannot be disabled once history exists.

---

## 7. Non-Functional Requirements (v2-scoped, additive to v1 §7)

| Category | Requirement |
|---|---|
| **Concurrency** | Stock deduction on invoice send **must** use row-level locking (`SELECT ... FOR UPDATE` on both the invoice row and each affected product row) inside the transaction — this is the one place in the system where v1's "last write wins" is no longer acceptable, because two simultaneous sales of the last unit must not both succeed. |
| **Idempotency** | Retrying the send or cancel action (client retry, double-click, network timeout) must never result in a duplicate deduction or reversal. Enforced by the invoice-status re-check under lock plus the database uniqueness constraint on `stock_movements` (§12) — belt-and-suspenders, not either/or. |
| **Data integrity** | `quantity_on_hand` is a derived/cached value; the `stock_movements` ledger is the source of truth. A scheduled or on-demand recompute (sum of movements) must be able to detect/repair drift — implement at minimum a manual "recalculate from ledger" admin action, even if not automated in v2. |
| **Performance** | Stock check + deduction adds negligible latency to invoice-send (one indexed lookup + lock per distinct product, after aggregation); no material change to the <2s page load target from v1. |
| **Migration safety** | Adding `track_stock`, `quantity_on_hand`, `reorder_level` to `products`, `oversell_policy` to `tenants`, and creating `stock_movements` must be a backward-compatible migration — existing pilot tenants' products default to `track_stock = false` and existing tenants default to `oversell_policy = 'block'`, so nothing changes for them until they opt in. |
| **Localization** | All new UI strings (stock labels, adjustment reasons UI, low-stock badge, oversell-policy setting) ship in Arabic + English from day one, consistent with v1. |

---

## 8. Business Rules (new, additive to v1 §8)

### Stock Tracking & Permissions
- Only `product`-type items can have `track_stock = true`. `service`-type items can never be stock-tracked (enforced server-side, not just hidden in UI).
- Once `track_stock` is enabled on a product, it **cannot be disabled** if the product has any `stock_movements` history — this avoids silently discarding a quantity history (consistent with v1's philosophy of archiving over destructive edits).
- **Every write to `quantity_on_hand` outside the automatic sale/cancellation flow is Owner-only** — this includes both enabling tracking with an opening balance (FR-10) and later adjustments (FR-13). There is no tier of stock-write action available to Staff.

### Product Type Immutability
- A product's `type` field becomes locked (`product`/`service` cannot be changed) once `track_stock = true` or once any `stock_movements` row exists for it, per FR-17. This closes the loophole where a tracked product could be converted to `service` to bypass the "cannot disable tracking" rule.

### Deduction Timing & Aggregation
- Stock is deducted at the moment an invoice transitions `draft → sent`, **not** at invoice creation and **not** at payment. A `draft` invoice never reserves or deducts stock, so multiple staff can draft invoices against the same limited stock without false conflicts — the check only happens at the commitment point (send).
- If the same product appears on more than one line of the same invoice, all such lines are **summed** before checking availability and before writing a movement row — the check and the deduction both operate on the aggregated per-product total for that invoice, never line-by-line. This prevents a multi-line invoice from bypassing the oversell check.
- Editing line items is already blocked once `sent` (v1 §8), so there is no "edit a sent invoice's quantities" case to reconcile against stock in v2.

### Idempotency
- Sending or cancelling an invoice must never produce more than one `sale` or `cancellation_reversal` movement per `(invoice, product)` pair, regardless of retries, double submissions, or overlapping requests. This is enforced structurally (a uniqueness constraint in §12), not only through UI-level "disable the button after click" behavior, which is not sufficient on its own against network-level retries.

### Reversal
- Per v1 §8, cancellation is only allowed from `draft` or `sent` — never from `partially_paid` or `paid`. As a direct consequence, stock reversal in v2 only ever applies to cancelling a `sent` (unpaid, un-deducted-from-payment) invoice. Once a payment has been recorded against an invoice, unwinding it (and any associated stock) is out of scope for v2 and remains deferred to the credit-note mechanism planned for **v4/v5**.

### Adjustments
- Manual adjustments require a non-empty reason string — this is the only audit trail for manual changes in v2 (no approval workflow, no dual control — acceptable at pilot scale, flagged as a limitation in §17 below).
- Adjustments are Owner-only, per the unified permission rule above.

### Oversell Policy
- The oversell policy (`block` or `warn`) is a single tenant-wide setting (FR-16), applied uniformly to every tracked product for that tenant — there is no per-product override in v2.

---

## 9. Error States (new, additive to v1 §9)

| Action | System Behavior |
|---|---|
| Send an invoice with a tracked product's aggregated line quantity exceeding available stock (policy = block) | Rejected (422); UI lists each short product with "Available: X, Requested: Y" (Y being the summed quantity across all lines for that product). |
| Send the same invoice (policy = warn) | Proceeds; invoice detail shows a persistent "sold below zero stock" badge until corrected. |
| Retry/duplicate a send request after it already succeeded | No-op: the invoice-status check fails fast (no longer `draft`), and if that race is somehow lost, the database uniqueness constraint on `stock_movements` prevents a second `sale` row from ever being written. |
| Staff attempts to enable stock tracking or set an opening balance | Blocked (403) — same pattern as Staff attempting Team Settings in v1. |
| Staff attempts a manual stock adjustment | Blocked (403). |
| Adjustment submitted with empty reason | Blocked (422) — reason is required, not optional. |
| Attempt to change a tracked product's `type` from `product` to `service` | Blocked (422) — type is locked once tracking/history exists (FR-17). |
| Attempt to set a negative `reorder_level` | Blocked (422) at validation — a reorder threshold below zero has no meaning. |
| Two staff send invoices for the last unit of the same product simultaneously | Row lock ensures only one succeeds; the second sees the "insufficient stock" error live, not a stale number. |

---

## 10. UX Requirements (additive to v1 §10)

| Requirement | Detail |
|---|---|
| Stock visibility in invoice line picker | Available quantity shown inline next to each tracked product in the type-ahead (v1's ShadCN Command picker), no extra click |
| Adjustment flow speed | ≤ 3 clicks from product detail to a saved adjustment |
| Low-stock badge | Reused visual language from v1's status badges — a consistent amber/red treatment, not a new pattern |
| Oversell policy setting location | Lives in the same Tenant/Company Settings screen as v1's currency/invoice-prefix settings — no new settings surface introduced |
| RTL | Stock list/adjustment/settings forms follow the same top-aligned label, RTL-first layout rules already established in v1 |

---

## 11. Technical Architecture (updated)

```
Next.js (App Router) + ShadCN/ui  ──HTTPS/JSON──▶  Laravel API (Sanctum auth)
                                                          │
                                                          ▼
                                                 PostgreSQL (tenant_id + global scope)
                                                          │
                                  ┌───────────────────────┼───────────────────────┐
                                  ▼                       ▼                       ▼
                         products.quantity_on_hand   stock_movements       tenants.oversell_policy
                         (cached, derived value)     (append-only ledger,  (single tenant-wide
                                                       source of truth,     enum, governs FR-11)
                                                       unique per
                                                       invoice+product+type)
```

No queue, no Redis, no Horizon, no event bus, no RLS in v2 — same as v1. Stock deduction is synchronous, inside the existing invoice-send request, using a DB transaction + row locks (see §7) rather than any async mechanism.

---

## 12. Data Model — v2 Additions

```
-- Additive columns on existing tables:
tenants (
  ...existing v1 columns...,
  oversell_policy VARCHAR DEFAULT 'block'   -- enum: 'block' | 'warn'
)

products (
  ...existing v1 columns...,
  track_stock BOOLEAN DEFAULT false,
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_level INTEGER NULL
    CHECK (reorder_level IS NULL OR reorder_level >= 0)
)

-- New table:
stock_movements (
  id,
  tenant_id,
  product_id,
  type,              -- enum: opening_balance | sale | cancellation_reversal | adjustment
  quantity_delta,    -- signed integer: positive = stock in, negative = stock out
  reference_type,    -- nullable: 'invoice' | null (for manual adjustments/opening balance)
  reference_id,      -- nullable: invoice_id when applicable
  reason,            -- nullable text; required (enforced at app layer) when type = adjustment
  created_by,
  created_at,

  -- Idempotency guard (§8, §9): at most one movement of a given type per
  -- invoice per product. Partial index so it only applies where a
  -- reference exists (manual adjustments/opening balances are exempt,
  -- since an Owner may legitimately make several separate ones).
  UNIQUE (tenant_id, product_id, reference_type, reference_id, type)
    WHERE reference_type IS NOT NULL
)
```

Notes:
- `quantity_on_hand` is a cached value maintained by every write to `stock_movements` inside the same transaction — never updated independently of a movement row.
- `stock_movements` is append-only — no updates, no deletes, matching the philosophy already applied to `payments` in v1 (a payment cannot be deleted once recorded).
- The unique constraint above is the structural half of the idempotency guarantee described in FR-11/FR-12 and §8 — application logic (status re-check under lock) is the first line of defense, this constraint is the backstop if that first line is ever bypassed by a bug or an unusual retry pattern.
- Whole integers only in v2 (no fractional quantities like 2.5 kg) — flagged as a known limitation in §17; fractional units are deferred until a real pilot need appears.

---

## 13. API Additions (extends v1 §13 conventions, same envelope/error format)

| Verb | Path | Purpose | Access |
|---|---|---|---|
| PATCH | `/api/v1/products/{id}/stock/enable` | Enable tracking + set opening quantity | Owner only |
| POST | `/api/v1/products/{id}/stock/adjustments` | Create a manual adjustment | Owner only |
| GET | `/api/v1/products/{id}/stock/movements` | List ledger history for one product (paginated) | Owner or Staff (read-only) |
| GET | `/api/v1/stock` | Current Stock list/report (filterable: `low_stock=true`) | Owner or Staff (read-only) |
| GET | `/api/v1/tenant/settings` | Read tenant settings, extended in v2 to include `oversell_policy` alongside v1's existing currency/invoice-prefix fields | Owner or Staff (read-only) |
| PATCH | `/api/v1/tenant/settings` | Update tenant settings, including `oversell_policy` (`block` \| `warn`) | Owner only |

*(Note: the API path prefix `/api/v1/` is the URL versioning scheme for the API itself, unrelated to the product-phase versioning (v1/v2/v3...) used throughout this document. The API prefix does not need to change just because the product phase advances to v2 — that's a separate axis, and renaming it isn't in scope here.)*

`POST /api/v1/invoices/{id}/send` (existing v1 endpoint) is **modified**, not replaced: it now performs the lock-check-aggregate-deduct transaction described in FR-11 before committing the status change, reading `oversell_policy` from the tenant record to decide block-vs-warn. Its response envelope is unchanged; on insufficient stock it returns the standard 422 error envelope with one error entry per short product (aggregated, not per line — see §8).

`POST /api/v1/invoices/{id}/cancel` (existing v1 endpoint) is similarly modified to perform the reversal described in FR-12, guarded by the same uniqueness constraint.

---

## 14. Design Guidelines (additions to v1 §14 stub)

- **Stock badges** — new color mapping, visually distinct from invoice status badges to avoid confusion: in-stock = default/neutral, low-stock = amber (same amber as `partially_paid`), out-of-stock/negative = red (same red as `overdue`).
- **Adjustment dialog** — reuse the v1 destructive-action confirmation pattern for any adjustment that reduces quantity; additive adjustments (receiving stock) don't need confirmation.
- **Oversell policy toggle** — a simple two-option control (radio or switch) in Tenant Settings, not a new page.

---

## 15. Roadmap — Sprint Plan (Solo Developer, v2 only)

Assumes v1 is already live; these sprints are purely additive.

| Sprint | Scope |
|---|---|
| **Sprint 6** | Migration (`track_stock`, `quantity_on_hand`, `reorder_level` + `CHECK`, `oversell_policy` on tenants, `stock_movements` table + unique constraint), Owner-only enable-tracking flow, Owner-only manual adjustment flow, oversell-policy setting in Tenant Settings (backend + frontend) |
| **Sprint 7** | Invoice-send deduction logic: invoice + product row locking, line aggregation, idempotency guard, block-vs-warn behavior from the real tenant setting, cancellation reversal |
| **Sprint 8** | Low-stock badges, Current Stock list/report, stock visibility in invoice line picker, product-type immutability guard, polish + pilot rollout to tenants who opted in |

**→ v2 demoable/usable at end of Sprint 8**, without any downtime or breaking change for tenants who don't enable stock tracking.

### Post-v2 Versions

| Version | Scope | Trigger to start |
|---|---|---|
| **v3** | Purchasing (suppliers, POs, goods receipt — becomes the *proper* way to add stock, replacing manual "opening_balance"/"adjustment" as the main inbound path) | Pilot users need to track what they buy, not just sell |
| **v4** | Accounting (chart of accounts, journal entries, inventory valuation, P&L/Balance Sheet) | Paying customers who need books, or an accountant brought in to design it |
| **v5** | SaaS billing automation, email invites/notifications (including low-stock alerts, deferred from v2 §1.4), Dashboard, Queue/Horizon, fuller audit log, RLS, payment reversal/credit notes, fractional stock quantities | Past pilot, onboarding customers self-serve |

---

## 16. Definition of Done (DoD) — same bar as v1 §16, applied to every v2 feature

- [ ] Backend implemented (endpoint, validation, business rules from §8 enforced server-side)
- [ ] Frontend implemented and wired to the real API (no mock data)
- [ ] Authorization checked (Owner-only for all stock-write actions and the oversell-policy setting; tenant scoping verified)
- [ ] Error states from §9 handled with real UI feedback
- [ ] Automated tests covering: happy-path deduction, insufficient-stock rejection (block policy), warn-policy negative-stock path, multi-line aggregation for a repeated product, and idempotency (sending an already-sent invoice, or forcing a duplicate insert against the unique constraint, does not double-deduct)
- [ ] **Concurrency test — minimum acceptable bar:** a database-level test using two overlapping transactions against the service/repository layer directly (not a full simulated HTTP race), asserting the row lock serializes the two attempts and only one succeeds. A full true-concurrency HTTP-level test is **not** required for v2 given solo-developer time constraints; if even the DB-level test proves impractical within Sprint 7, a documented manual QA script (two browser sessions, same last-unit product, both click "send" within the same second) is an acceptable substitute, with the gap noted in §17 rather than silently skipped.
- [ ] RTL layout verified with real Arabic content
- [ ] Both English and Arabic strings present
- [ ] Responsive on mobile viewport
- [ ] No errors/warnings in browser console
- [ ] Migration verified against a copy of pilot production data (existing products default to untracked, existing tenants default to `oversell_policy = 'block'`, no data loss)
- [ ] README note added, including the new known limitation(s) from §17

---

## 17. Technical Debt & Known Limitations (v2, additive to v1 §17)

- `quantity_on_hand` is a cached value; if it ever drifts from the sum of `stock_movements` (e.g., due to a bug or manual DB edit), there is only a manual "recalculate" action, not automatic reconciliation. **Mitigation:** a test asserting the cached value always matches the ledger sum after each of the operations in §6.
- Whole-number quantities only — no fractional units (kg, liters). Flag before onboarding any pilot tenant that sells by weight/volume.
- No stock reservation on `draft` invoices — two staff can draft against the same last unit; only the first to *send* wins (by design, see §8), but this can surprise a user who drafted first and sends second. Document this in onboarding.
- Manual adjustments have no approval workflow — any Owner can adjust stock to any value with just a free-text reason. Acceptable at pilot scale (single owner per tenant in most cases); revisit if a tenant has multiple Owners.
- No low-stock notifications (email/push) — badge is visible only when a user is actively looking at the product or stock list. Consistent with v1's "no system email" limitation; revisit at v5.
- Single implicit location per tenant — no support for "stock at Warehouse A vs Store B." Flag before onboarding any pilot tenant that operates multiple physical locations.
- Oversell policy is tenant-wide only — a tenant that wants "block for high-value items, warn for the rest" has no way to express that in v2 (see §19 backlog).
- If the DB-level concurrency test specified in §16 proves impractical to automate within Sprint 7, the fallback is a documented manual QA script rather than an automated regression test — track this explicitly if it happens, since it means the race-condition guarantee is verified once, not on every CI run.

---

## 18. Open Questions

- Should v2 offer per-product override of the oversell policy in a later iteration, or is tenant-wide sufficient long-term? (Tenant-wide is the firm v2 decision — see FR-16 — this question is only about whether to revisit post-v2, tracked in §19.)
- Any pilot tenant that sells by weight/volume (fractional quantities) who should be flagged *before* onboarding, given §17's whole-number limitation?

---

## 19. Appendix — Backlog Items Newly Identified in v2 (added to v1 §19)

- Fractional/decimal stock quantities
- Stock reservation on draft invoices (soft-hold with expiry)
- Multi-location/warehouse stock (already listed in v1 §19, reaffirmed here as still deferred)
- Low-stock email/push notifications
- Approval workflow for large manual adjustments
- Automatic reconciliation/drift-detection between `quantity_on_hand` and the movement ledger
- Per-product override of the oversell policy (currently tenant-wide only, per FR-16)