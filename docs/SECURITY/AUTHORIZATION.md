# AUTHORIZATION.md
> What an authenticated user is allowed to do.

## LAYERS
1. RLS (database) — rows scoped to owner/participant.
2. API route checks — caller's right to the specific data.
3. UI routing — per-user-type route trees; wrong type redirected (A5).

## USER-TYPE ISOLATION
- Each user type has its own route tree; a manufacturer cannot load /brand/* content.
- Force-clear stale localStorage that could bleed one type's data into another.

## ENTERPRISE ROLES (planned)
- Default hierarchy CEO → dept heads → teams; Owner can restructure (P5).
- Real role-based permissions; CFO builds own team.
- Approval chains; hard limits (escrow/financials/permissions/deletion) owner-only.

## DELEGATED FREELANCER ACCESS (planned — P10)
- Scoped to the gig; propose-by-default; owner approves; money never delegable.

## RULES
- Never trust client-supplied user_id for reading others' data — validate against session.
- Money and irreversible actions always require the owner's explicit approval.
