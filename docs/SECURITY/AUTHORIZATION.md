# AUTHORIZATION.md
> What an authenticated user is allowed to do.

## LAYERS
> ⚠️ **CORRECTED 2026-08-28 (M10 docs sweep).** This list used to name **RLS as
> layer 1**, which contradicted a locked decision: **[I8] formally RETIRED RLS
> as a security mechanism on 2026-07-29.** The policies in `supabase/schema.sql`
> reference `auth.uid()`, which `users.id` never equals, so they have never
> matched anything — and `auth.uid()` has no AWS RDS equivalent, so investing in
> them builds something the migration deletes.

1. **API route checks — THIS IS THE SECURITY BOUNDARY.** `getVerifiedUser()` /
   `getVerifiedCallerPhone()` plus an ownership check, proven end-to-end across
   route Groups 1, 2a, 2b and 2c — including that a rejected request writes
   nothing.
2. **Rate limits and lockouts** — per-account lockout ([I23]), OTP send and
   reset-verify throttles ([I33]), login anti-spraying ([I35]). These bound
   abuse of endpoints the caller is otherwise entitled to reach.
3. **UI routing** — per-user-type route trees; wrong type redirected (A5).
   ⚠️ **A UX guard, NOT a boundary.** `AuthGuard` improves perception; the
   server-side checks are what actually keep data locked.
4. ~~RLS (database)~~ — **retired, decorative, must not be relied on.** Do NOT
   write new `auth.uid()` policies. If compliance later demands defence in
   depth, rewrite against `current_setting('app.user_id')` set per-transaction —
   standard PostgreSQL, portable to RDS (CORE T2).

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
