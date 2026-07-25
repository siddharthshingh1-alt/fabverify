# DEPENDENCIES.md
### External Dependencies & Why Each Exists
> Keep this lean. Every dependency is a liability (security, maintenance, migration). Add one only when it clearly earns its place. Prefer standard platform features over libraries.

---

## RUNTIME — CORE (required)
| Dependency | Why | Migration note |
|---|---|---|
| `next` | The framework — routing, SSR, API routes | Core; stays |
| `react`, `react-dom` | UI + `createPortal` for modals | Core; stays |
| `typescript` | Type safety; zero-error builds | Core; stays |
| `@supabase/supabase-js` | DB + Auth + Storage client | **Only imported in `db.ts` & `supabase.ts`.** On AWS RDS migration, replaced by a Postgres client (e.g. `pg`/Prisma) in `db.ts` only |

## RUNTIME — INTEGRATIONS (added as phases require)
| Dependency / Service | Why | Phase |
|---|---|---|
| Twilio (via Supabase Auth) | SMS OTP | live (⚠️ trial) |
| 2Factor.in (candidate) | India-specific SMS, cheaper | Phase A (if chosen over Twilio) |
| Payment Aggregator SDK/API (Razorpay Route / Cashfree / Castler) | Licensed escrow — holds money | Phase A |
| NBFC partner API | Honest credit (FabPay Later/FabFloat/FabMaterial) | Phase C+ |
| Gov verification provider (AuthBridge/Gridlines/eKYCNow) | Aadhaar/PAN/GST/Udyam/CIN checks | Phase B |
| WhatsApp Business API | Notifications | Phase A/B |
| QR library (generate/scan) | Traceability nodes | Phase B |
| S3 SDK | Object storage on AWS | Migration |

## DEV / BUILD
| Dependency | Why |
|---|---|
| ESLint / TS config | Lint + type checks |
| Vercel CLI (optional) | Local deploy testing |

---

## DEPENDENCY RULES
1. **Justify before adding.** If a standard React/Next feature or a small helper can do it, don't add a library.
2. **No dependency may import Supabase logic outside `db.ts`/`supabase.ts`.**
3. **Do NOT install the "ponytail"/write-least-code tool** (X1) — mindset only; reliability wins for safety-critical code.
4. **Pin versions**; review before upgrading (Next.js param-async behavior is version-sensitive — A9).
5. **Security:** review any dependency that touches auth, money, files, or crypto especially carefully. Never a dependency that would send user data to a third party without consent.
6. **Migration-awareness:** anything that couples us to Supabase-specific behavior must be isolated to `db.ts`/`supabase.ts`.

## KNOWN VERSION-SENSITIVE BEHAVIORS
- Next.js dynamic route params are async (`await params`) in this version (A9).
- Supabase throws plain objects, not `Error` — use `getErrorMessage()`.
- `createPortal` modals need a `mounted` guard to avoid SSR/hydration issues (A11).

## SECRETS (never dependencies, never committed)
`SUPABASE_SERVICE_ROLE_KEY`, payment-partner keys, NBFC keys, verification-provider keys, WhatsApp tokens — all in server-only env vars.
