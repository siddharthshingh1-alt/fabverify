# MODULE: ORDER_MANAGEMENT
> The core transaction lifecycle.

## PURPOSE
Run an order from creation to close, with verified milestones and escrow-linked releases.

## WHAT IT DOES
- Place bulk order (8-step form + full document set).
- Accept/decline; auto-create 5 milestones.
- Track order + milestones (both sides see real data).
- Planned: order completion + final release; delivery-address persistence; reorder flow; enterprise Kanban.

## STATUS
Place/accept/track ✅ · milestones ✅ · completion/close 🔴 · delivery address 🔴 · reorder 🔴 · Kanban 🟡.

## KEY RULES
Milestone releases tie to verified proof (M2). paymentRows vocabulary: Released/Pending (not active/pending). Reorder references COL- + golden sample for consistency.

## CONNECTS TO
Escrow · Traceability (milestone verification) · Communication · Merchandising (T&A) · Sampling (PP → production standard).

## DATA
orders, order_milestones (live). TODO columns: delivery_address, special_instructions.
