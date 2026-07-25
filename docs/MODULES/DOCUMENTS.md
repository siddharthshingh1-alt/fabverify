# MODULE: DOCUMENTS
> Tech packs, sample records, certificates, reports — the document spine.

## PURPOSE
Store, version, and flow the documents that define a garment: tech packs, sample rounds, inspection reports, certificates, compliance records.

## WHAT IT DOES
- Tech pack upload + version control (TP-…-vN); revision-scope boundary; flows into manufacturing; BOM feeds sourcing.
- Sample records (Proto/Fit/SizeSet/PP golden sample) with photos + measurements.
- Inspection reports (4-Point / AQL), debit notes.
- Certificates: authenticity (AUTH-), GI-tag, fastness, compliance (REACH/AZO), test reports.
- Order document set (tech pack, CAD, grading, product, quality, trim, fabric-indent, wash-care, PPM).

## STATUS
Bulk-order document set (form) ✅ · tech-pack version control 🔴 · sample records 🔴 · inspection reports 🔴 · certificates 🔴.

## KEY RULES
Version control is the top designer pain — solve it (clear vN history, one current approved version). Golden sample (SMP-…-PP) becomes production standard + QC benchmark. FabVerify does NOT create designs — it stores/versions/flows them (P13).

## CONNECTS TO
Designer · Master · QC · Orders · Supply Chain (BOM → FAB/TRIM) · Traceability (docs attach to nodes).

## DATA
Planned tech_packs (versioned), sample_jobs, inspection_reports, certificates; order docs currently in form/JSONB.
