# CURRENT_SPRINT.md
### What We Are Working On Right Now
> Claude Code reads this at session start to know the current focus. Update at the start and end of each working session. Keep it short — this is "now," not the whole roadmap.

---

## SPRINT FOCUS
**Documentation + Phase A prep.** We just completed the Google-level documentation system. The next build focus is **Phase A — make what exists trustworthy** (see `ROADMAP.md`).

## ACTIVE NOW
- ✅ Documentation system (Tier 1–3) — complete.
- ⏭️ Next up (pick one to start Phase A):
  - Real SMS (upgrade Twilio OR switch to 2Factor.in via custom route) — currently blocks real prod signups.
  - Supabase Storage for photos (replace base64) — prevents a scale-time break.
  - Admin verification approval panel — Silver/Gold currently sit pending forever.
  - Order completion flow + delivery-address column.
  - Password login option.

## BLOCKERS / DEPENDENCIES
- Real escrow needs a licensed payment-aggregator partner (application + KYC on FabVerify) — start the partner conversation in parallel; build screens/logic with simulated money meanwhile.
- Real SMS to arbitrary numbers blocked by Twilio trial.

## RECENTLY FINISHED
- Full per-user-type vision locked.
- Core features on real DB (profiles, discovery, enquiries, orders, messages, sample briefs, verification).
- Documentation system.

## NOTES FOR CLAUDE CODE
- Before building anything, read `PROJECT_MEMORY.md` to confirm status and `DECISIONS.md` for locked choices.
- Everything Phase-A must keep migration-readiness (all DB via `db.ts`).
- Update `PROJECT_MEMORY.md` + `CHANGELOG.md` when a task completes.
