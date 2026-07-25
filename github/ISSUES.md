# GITHUB: ISSUES
> Known open issues / tech debt. Mirror of PROJECT_MEMORY known-issues, tracked for action.

## HIGH PRIORITY
- [ ] Twilio trial blocks real SMS to arbitrary numbers → upgrade or 2Factor.in.
- [ ] Photos stored as base64 in DB → move to Supabase Storage (scale risk).
- [ ] Silver/Gold verification applications sit pending → build admin approval panel.
- [ ] No order-completion flow; no delivery-address column.

## MEDIUM
- [ ] Password login option not built.
- [ ] Manufacturer profile detail: Catalogue/Reviews/Certs are fake data.
- [ ] Enterprise: CEO money-first view + real departments + permissions not built.
- [ ] Some components have hardcoded colors → theme sweep for true one-file theming.

## LOW / HYGIENE
- [ ] CREATE POLICY re-run errors (add DROP POLICY IF EXISTS / guards for idempotent schema).
- [ ] Mobile responsiveness pass on main platform.
- [ ] Notifications centre; global search on real data.

## PROCESS
Fix per BUG_FIX_RULES. Update this list + CHANGELOG + PROJECT_MEMORY when resolved.
