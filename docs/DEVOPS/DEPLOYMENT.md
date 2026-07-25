# DEVOPS: DEPLOYMENT
## CURRENT
- Host: Vercel. Auto-deploys on push to main.
- Repo: github.com/siddharthshingh1-alt/fabverify.
- Live: fabverify.vercel.app.

## PROCESS
1. Build locally (npm run build) — must pass clean.
2. Commit (accurate message) → push to main.
3. Vercel auto-builds + deploys.
4. Verify on live URL; check Vercel Deployments/Functions/Logs on failure.

## ENV VARS (Vercel)
NEXT_PUBLIC_SUPABASE_URL (bare project URL, no /rest/v1/), NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only). Add partner keys as integrations land.

## ROLLBACK
Vercel: redeploy a previous deployment. Code: git revert/checkout. Every version is recoverable.

## MIGRATION
Supabase → AWS RDS: change db.ts + env vars; app otherwise unchanged.
