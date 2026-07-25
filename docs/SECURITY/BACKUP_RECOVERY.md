# BACKUP_RECOVERY.md
> Keeping data safe and recoverable.

## CURRENT
- Supabase managed Postgres (provider backups). Git history for all code (every version recoverable via git log/checkout/revert).

## PRACTICES
- Regular DB backups (verify Supabase backup cadence; add scheduled exports before scale).
- Never hard-delete critical data; prefer soft-delete/status flags (deletion is a prohibited destructive action without explicit intent).
- Test restore periodically.
- Before schema changes: back up; changes are additive where possible.

## MIGRATION (Supabase → AWS RDS)
- Export/import standard Postgres dump; only db.ts changes in app.
- Move photos base64 → Storage → S3 as part of this.

## DISASTER RECOVERY
- Code: redeploy from GitHub to Vercel (or elsewhere) any time.
- Data: restore from latest backup.
- Secrets: rotate keys if ever exposed; never in git so blast radius is limited.
