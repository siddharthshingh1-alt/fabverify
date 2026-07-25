# MODULE: RFQ (Enquiries & Sample Briefs)
> The request layer before an order.

## PURPOSE
Let buyers ask questions and post structured briefs; let makers respond — bridging discovery to a real order.

## WHAT IT DOES
- Enquiries (buyer → maker; rejects unregistered receiver; seeds initial chat message).
- Sample briefs (buyer posts; makers see brief-requests list; respond flips status to responses_received).
- Planned: quote comparison (side-by-side).

## STATUS
Enquiries ✅ · sample briefs post/respond ✅ · quote comparison 🔴.

## KEY RULES
An enquiry to a non-member fails cleanly (404) with a path (invite/waitlist). Brief response sends a message + updates status.

## CONNECTS TO
Discovery · Communication (seeds chat) · Orders (brief → order) · Sampling.

## DATA
enquiries, sample_briefs (live).
