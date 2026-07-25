# DEVOPS: INFRASTRUCTURE
## CURRENT STACK
Vercel (app hosting) + Supabase (Postgres, Auth, Storage) + Twilio (SMS) + GitHub (source).

## TARGET (scale/migration)
AWS RDS (Postgres) replacing Supabase DB via db.ts; S3 for photos; licensed payment-aggregator + NBFC + gov-verify + WhatsApp integrations.

## PRINCIPLES
- Asset-light, low burn (the anti-Zilingo model) — minimal infra until scale demands.
- Migration-ready: standard Postgres, env-var config, db.ts seam.
- Data localised in India (RBI) for payment data.

## SCALING PLAN
- Split FabChat to its own deployment (copy /chat) when mobile scale warrants (A8).
- Background jobs/queues for heavy QR/verification processing at volume.
- CDN/object storage for photos.
