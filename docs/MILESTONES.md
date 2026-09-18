# Sprint 6 — Inventory & Stock Management (v2)
**Foundation Sprint: Schema, Owner-only write flows, oversell policy setting**

Builds on: v1 MVP (live in pilot use)
Depends on: none (first sprint of v2)
Precedes: Sprint 7 (invoice-send deduction logic), Sprint 8 (reporting/badges)

---

## 1. Database Migration

- [ ] `products` table — add columns:
  - [ ] `track_stock BOOLEAN DEFAULT false`
  - [ ] `quantity_on_hand INTEGER DEFAULT 0`
  - [ ] `reorder_level INTEGER NULL`
  - [ ] `CHECK (reorder_level IS NULL OR reorder_level >= 0)`
- [ ] `tenants` table — add column:
  - [ ] `oversell_policy VARCHAR DEFAULT 'block'` (enum: `block` | `warn`)
- [ ] New `stock_movements` table:
  - [ ] `id`
  - [ ] `tenant_id`
  - [ ] `product_id`
  - [ ] `type` (enum: `opening_balance` | `sale` | `cancellation_reversal` | `adjustment`)
  - [ ] `quantity_delta` (signed integer)
  - [ ] `reference_type` (nullable: `invoice` | null)
  - [ ] `reference_id` (nullable)
  - [ ] `reason` (nullable text; required at app layer when `type = adjustment`)
  - [ ] `created_by`
  - [ ] `created_at`
  - [ ] Partial unique constraint: `UNIQUE (tenant_id, product_id, reference_type, reference_id, type) WHERE reference_type IS NOT NULL`
- [ ] Migration tested against a **copy of pilot production data**:
  - [ ] Existing products default to `track_stock = false`
  - [ ] Existing tenants default to `oversell_policy = 'block'`
  - [ ] No data loss / no downtime

**Implementation constraints (PRD §12, apply to both flows built this sprint):**
- `quantity_on_hand` is a **cached/derived** value — it must only ever be written inside the same transaction as the corresponding `stock_movements` insert, never updated independently.
- `stock_movements` is **append-only** — no update or delete operations against it, ever (same rule v1 already applies to `payments`).
- The unique constraint on `(tenant_id, product_id, reference_type, reference_id, type)` is scoped to `WHERE reference_type IS NOT NULL`. Both movement types created in Sprint 6 (`opening_balance`, `adjustment`) have `reference_type = null`, so this constraint isn't actually exercised until Sprint 7 (`sale`/`cancellation_reversal`). Still correct to migrate it now — just don't expect it to be testable yet.

---

## 2. Enable Stock Tracking Flow (FR-10) — Owner-only

- [ ] Owner can toggle "Track stock" on for a `product`-type item
- [ ] Owner supplies opening quantity (≥ 0), required once
- [ ] On submit: writes a `stock_movements` row, `type = opening_balance`
- [ ] `quantity_on_hand` set accordingly
- [ ] Optional `reorder_level` (≥ 0) settable at the same time
- [ ] Fresh product creation: tracking + opening stock settable in the same create form (no two-step flow required), default opening quantity 0
  - ⚠️ **Gap:** §13's API table only lists `PATCH /products/{id}/stock/enable` for *existing* products — no endpoint is specified for setting `track_stock`/opening quantity at creation time. Decide: extend the v1 product-create endpoint to accept these fields, or have the frontend call create → enable as two requests behind one form. See Open Questions below.
- [ ] Staff cannot see the "Track stock" toggle or opening-quantity field in the UI
- [ ] Endpoint rejects Staff-originated requests directly (**403**)
- [ ] `service`-type items never show a "Track stock" option, for any role
- [ ] No historical reconstruction — opening balance is simply what the Owner counts today (documented decision, not a bug)

**Endpoint:** `PATCH /api/v1/products/{id}/stock/enable` — Owner only

---

## 3. Manual Stock Adjustment Flow (FR-13) — Owner-only

- [ ] Owner can submit an adjustment on a tracked product: new quantity OR +/- delta
- [ ] Reason field is **required** (free text)
- [ ] On submit: writes a `stock_movements` row, `type = adjustment`
- [ ] `quantity_on_hand` recalculated immediately
- [ ] Staff attempting this action (UI or API) are denied with **403**
- [ ] UI: reuse v1's destructive-action confirmation pattern for adjustments that **reduce** quantity
- [ ] UI: additive adjustments (receiving stock) do **not** require confirmation

**Endpoint:** `POST /api/v1/products/{id}/stock/adjustments` — Owner only

---

## 4. Oversell Policy Setting (FR-16) — Owner-only, tenant-level

- [ ] Tenant Settings page extended with oversell policy control (reuse existing settings area — no new page)
- [ ] Two-option control (radio or switch): "Block sales that exceed stock" (default) vs. "Allow, but show a warning"
- [ ] Owner can select and save; value persists on the tenant record
- [ ] New tenants provisioned with `oversell_policy = 'block'` by default
- [ ] Staff can read the setting but not write it
- [ ] Note: this setting is stored/editable in Sprint 6 but not yet **consumed** — invoice-send enforcement is Sprint 7 (FR-11)

**Endpoints:**
- `GET /api/v1/tenant/settings` — Owner or Staff (read-only), extended to include `oversell_policy`
- `PATCH /api/v1/tenant/settings` — Owner only

---

## 5. Definition of Done (Sprint 6 subset of PRD §16)

- [ ] Backend implemented: endpoints, validation, business rules enforced server-side
- [ ] Frontend implemented and wired to real API (no mock data)
- [ ] Authorization verified: Owner-only on all stock-write actions and oversell-policy write; tenant scoping verified
- [ ] Error states handled with real UI feedback (not just console logs)
- [ ] Automated tests: enable-tracking happy path, Staff-blocked (403) cases, adjustment happy path, adjustment validation (reason required)
- [ ] RTL layout verified with real Arabic content
- [ ] Both English and Arabic strings present
- [ ] Responsive on mobile viewport
- [ ] No errors/warnings in browser console
- [ ] Migration verified against a copy of pilot production data (see §1 above)
- [ ] README note added for any new known limitation introduced this sprint

---

## Explicitly NOT in Sprint 6

- ❌ Invoice-send deduction logic, row locking, line aggregation, idempotency-in-practice (FR-11) → **Sprint 7**
- ❌ Cancellation stock reversal (FR-12) → **Sprint 7**
- ❌ Low-stock badges, Current Stock list/report, invoice line-picker stock visibility (FR-14, FR-15) → **Sprint 8**
- ❌ Product-type immutability guard → **Sprint 8**
- ❌ Any consumption of `oversell_policy` in actual sale logic — it's just stored/settable this sprint

---

## Open Questions Identified in This Sprint's Scope

- **Product-create endpoint:** no API is specified for enabling tracking + opening stock at product-creation time (§5.1 describes the UX, §13 doesn't list the endpoint). Needs a decision before frontend work starts.
- **`GET /products/{id}/stock/movements`:** listed in §13 but not assigned to any sprint in §15's roadmap. Candidate for Sprint 6 (useful for verifying opening-balance/adjustment writes) or Sprint 8 (bundled with reporting). Needs explicit placement.
- **Editing `reorder_level` after initial set:** FR-10/§5.1 only cover setting it at tracking-enable time. No endpoint/flow is described for changing it afterward. Confirm whether this is in scope for Sprint 6 or deferred.

---

## Reference
Source: PRD-v2 — Inventory & Stock Management, §6 (FR-10, FR-13, FR-16), §12 (Data Model), §13 (API Additions), §15 (Roadmap), §16 (DoD)