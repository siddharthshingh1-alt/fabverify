# CODING_STANDARDS.md
### The Rules That Prevent Bugs
> These are enforced on every line. The user's explicit goal is "when we write a line of code there is no bugs." These standards are how we get as close as possible. Violating one is a defect, not a style preference.

---

## DATABASE
- **All DB access through `db.ts`.** No component or non-gateway file imports Supabase (T1). If you need data, add/using a `db.ts` function.
- **Use real column names** — read `DATABASE.md` first. Never guess a column.
- **Upserts** specify `onConflict` on the UNIQUE column.
- **Two FKs to `users`** → use explicit hints (`buyer:users!buyer_id`).
- **Never write Supabase-specific SQL** (T2).

## API ROUTES
- Validate every input before use. Reject bad input with the correct 4xx status.
- Wrap logic in try/catch. Return correct status codes (200/201/400/401/403/404/500).
- Use the shared **`getErrorMessage()`** helper — Supabase throws plain objects, so `error instanceof Error` fails silently.
- Dynamic routes: `params: Promise<{ id: string }>` then `const { id } = await params;` (A9).
- Never expose secrets or raw government IDs in responses or logs.

## CLIENT DATA FETCHING
- Every fetch handles **three states**: loading, empty, error (T5). A blank screen on empty data is a bug.
- Show a spinner/skeleton while loading; a friendly empty state when no data; a clear error with a retry path on failure.
- Never assume an array is non-empty before rendering.

## REACT
- **Unique keys** on every `.map()` — a DB id, or `` `${item.name}-${index}` `` — never a value that can repeat (T7). Repeated keys caused real bugs.
- **Full-screen modals** use `createPortal(node, document.body)` with a `mounted` guard; never render inline in a panel (A11).
- Controlled inputs for forms; manage state with `useState`/`useReducer`.
- **No `localStorage`/`sessionStorage` as source of truth** for money, orders, or verification. localStorage only mirrors auth/session/profile for convenience.
- Clean up timers/intervals/subscriptions in `useEffect` return.

## ROUTING & USER TYPES
- Every user type has its own route tree (A5). No shared adaptive `/dashboard`.
- Route wrappers check the user type and **redirect if wrong** before rendering (prevents content-bleeding).
- Force-clear stale localStorage that could bleed one type's data into another (e.g. enterprise position data on a brand dashboard).

## AUTH & SECURITY
- Dev OTP bypass gated to `localhost`/`127.0.0.1` via `window.location.hostname` ONLY — never `NODE_ENV` (A10).
- Secrets in env vars, server-only; never `NEXT_PUBLIC_*` for secrets; never committed.
- Verify `.gitignore` covers `.env.local` before any commit.
- Never store raw Aadhaar/card/password; store verified status only.

## MONEY & CREDIT (safety-critical)
- Never route customer funds into a FabVerify-owned account (M1). Escrow instructions go to the licensed partner.
- Never build a credit flow with hidden charges; every charge itemized in the KFS; no prepayment penalty (M3).
- Release payment only on verified milestones within tolerance (M2, V4).

## VERIFICATION ENGINE
- Use the shared engine (QR nodes, SMV/capacity, tolerance, FabScore) — don't reimplement per module.
- Apply the 10–15% tolerance buffer and three-level response everywhere capacity/reconciliation is checked (V4). Never false-alarm on normal variation.
- Unit-adaptive math: pieces×SMV vs meters (V2). Fabric expects 3–5% shrinkage.

## TYPESCRIPT & BUILD
- `npm run build` must pass with **zero TS errors** before "done" (T9).
- No `any` unless genuinely unavoidable; if used, comment why.
- Type function inputs/outputs, especially in `db.ts`.

## NAMING & STRUCTURE
- Shared page components in `components/pages/*`; thin route wrappers per user type.
- Follow the numbering system in `CORE.md` exactly for any entity IDs (FAB-, TRIM-, JOB-, ORD-, etc.), always with an optional user custom-code field.
- Descriptive names; no cleverness that obscures intent.

## COMMITS & MEMORY
- **Accurate commit messages** describing what actually changed (X2). Never overstate.
- After a task: update `PROJECT_MEMORY.md` status, add a `CHANGELOG.md` entry, log any new decision in `DECISIONS.md`.

## MIGRATION-READINESS (every change)
- Standard Postgres only; all DB via `db.ts`; env-var config; no vendor-specific features hardcoded in components. If a task seems to require breaking this, flag it before proceeding.

## THE PRE-COMMIT CHECKLIST
1. Does every DB call go through `db.ts`?
2. Do all fetches handle loading/empty/error?
3. Are all list keys unique?
4. Do API routes validate input, try/catch, and use `getErrorMessage()`?
5. Are dynamic route params awaited?
6. Are secrets out of the client and out of git?
7. Does `npm run build` pass clean?
8. Did I update PROJECT_MEMORY / CHANGELOG?
9. Is the commit message accurate?
10. Did I break migration-readiness anywhere?
