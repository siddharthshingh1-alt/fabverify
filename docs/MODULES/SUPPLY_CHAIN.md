# MODULE: SUPPLY_CHAIN
> Fabric, trims, job-work, and the physical flow of goods.

## PURPOSE
Model the real physical supply chain — mills (meters), trims (7 categories), job workers (single-stage) — and connect it into one traceable order.

## WHAT IT DOES
- Fabric Mill: catalogue, swatch, lab dips, dye lots, shade bands, colour library, greige, dead-stock, meter-based verification.
- Trim Supplier: 7-category catalogue, artboard approval, MOQ reserve, care-label checker.
- Job Worker: parent-linked jobs, receive-process-return + reconciliation, dual pricing, SMV capacity, shift-proof + overtime tagging.
- Enterprise: Visual Stock Panel + Universal Item Identity.

## STATUS
All type-specific supply-chain features 🔴 (design-locked). See USER_TYPES.md for each.

## KEY RULES
Mills measured in meters (3–5% shrinkage normal). Trims cause 67% of delays → arrival tracking matters. Job orders always show parent. Universal Item Identity underpins reserve/reorder/inventory.

## CONNECTS TO
Orders · Traceability (dye lot = first node) · Merchandising (booking) · FabPricingEngine (real prices) · Enterprise (stock panel).

## DATA
Planned fabrics/lab_dips/dye_lots/approved_colours/trims/trim_artboards/trim_reserves/job_orders/shift_proofs/inventory_items.
