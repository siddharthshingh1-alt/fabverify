# CLAUDE.md
### Master Operating Instructions for Claude Code
> Read this file FIRST, in FULL, at the start of every session. It is the single most important file in the repository.

---

## 0. WHAT THIS FILE IS

This is the constitution for how code gets written in FabVerify. It tells you (Claude Code) how to behave, what to read, what standard to hold, and what never to do. If anything you are about to do conflicts with this file, STOP and ask.

The goal of this project is **Google-level engineering discipline** — every line of code is intentional, tested, aligned with the locked vision, and free of avoidable bugs. We move deliberately, not fast-and-broken.

---

## 1. SESSION START PROTOCOL (do this every time, in order)

Before writing a single line of code in any session:

1. **Read `CLAUDE.md`** (this file) — fully.
2. **Read `PROJECT_MEMORY.md`** — this is what already exists and works. Never rebuild what is already built.
3. **Read `DECISIONS.md`** — these are locked decisions. Never silently reverse them.
4. **Read `CURRENT_SPRINT.md`** and **`TASKS.md`** — this is what we are working on right now.
5. **Read `CORE.md`** — the non-negotiable rules of the system.
6. Only THEN begin work.

If the user asks for something that contradicts `DECISIONS.md` or `CORE.md`, do not just do it — flag the conflict, quote the relevant decision, and ask for confirmation.

---

## 2. THE PRIME DIRECTIVES (never violate these)

1. **Never rebuild what already exists.** Check `PROJECT_MEMORY.md` first. If a feature, table, or API route is listed as built, extend it — do not recreate it. Recreating causes duplicate systems and bugs (this has happened before — e.g. two order systems, two verification-tier columns).

2. **Never reverse a locked decision silently.** `DECISIONS.md` is law. If you think a decision is wrong, say so and ask — do not just change it.

3. **The database abstraction layer is sacred.** ALL database calls go through `app/lib/db.ts`. No file except `db.ts` and `app/lib/supabase.ts` may import Supabase directly. This is what lets us migrate to AWS RDS later by changing one file. If you add a DB call anywhere else, you have introduced a migration bug.

4. **Standard PostgreSQL only.** No Supabase-specific SQL features. No Supabase realtime syntax hardcoded into components. Everything must work identically on AWS RDS.

5. **Money is never held by FabVerify.** Escrow is always via a licensed RBI payment-aggregator partner. FabVerify only controls release LOGIC, never holds funds. Never write code that puts customer money into a FabVerify-owned account.

6. **Credit is honest by design.** Any credit feature shows one all-in APR, a plain-language Key Fact Statement, no hidden charges, no prepayment penalty. Never build a credit flow with hidden fees.

7. **Verification is real, not self-declared.** Trust badges come from real government-database checks (Aadhaar/DigiLocker, GST, Udyam, PAN, CIN) — never from an uploaded document alone.

8. **Child-safety / user-safety of data:** Never log, expose, or store Aadhaar numbers, full card numbers, passwords, or service-role keys. Aadhaar → store verified status only. Secrets → environment variables only, never committed.

9. **Every user type has its own URL.** No shared `/dashboard` that adapts by localStorage — that caused content-bleeding bugs. Routes are `/brand/*`, `/manufacturer/*`, `/mill/*`, `/supplier/*`, `/artisan/*`, `/jobworker/*`, `/talent/{designer,master,merchandiser,qc}/*`, `/enterprise/*`.

10. **When unsure, ask. Do not assume.** A wrong assumption compounded across a build is expensive. One clarifying question is cheap.

---

## 3. CODE QUALITY STANDARD (the "no bugs" rules)

The user's explicit goal: *"when we write a line of code there is no bugs in that."* That is aspirational, but here is how we get as close as humanly possible:

### Before writing code
- Read the relevant module doc in `docs/MODULES/`.
- Check `PROJECT_MEMORY.md` to see if it exists.
- Check `docs/ARCHITECTURE/DATABASE.md` for the real schema before writing any query.
- Confirm you are using real column names, not guessed ones.

### While writing code
- **Every DB call goes through `db.ts`.** No exceptions.
- **Every API route** has: input validation, try/catch, correct HTTP status codes, and uses the shared `getErrorMessage()` helper (Supabase throws plain objects, not `Error` instances — `error instanceof Error` fails silently).
- **Every fetch on the client** has: loading state, empty state, and error state. A page that fetches from the DB and shows a blank screen on empty data is a bug.
- **Every dynamic route** uses `params: Promise<{ id: string }>` and `await params` (this Next.js version requires async params).
- **Every `.map()`** uses a guaranteed-unique key — a DB id, or `` `${item.name}-${index}` `` — never a value that can repeat (repeated keys caused real bugs, e.g. duplicate "Lucknow").
- **No `localStorage`/`sessionStorage` in artifacts.** In the app, localStorage is only for auth/session/profile mirror — never the source of truth for money, orders, or verification.
- **React modals** that must overlay the whole screen use `createPortal(..., document.body)` with a `mounted` guard, not inline rendering (inline rendering caused modals to render inside the left panel).

### After writing code
- Run `npm run build`. It must pass clean with zero TypeScript errors before you consider the task done.
- Fix every TypeScript error — do not suppress with `any` unless genuinely unavoidable, and if so, comment why.
- Report exactly what files you created/changed and why.

### Commit discipline
- Commit messages must be **accurate**, describing what actually changed — never overstated. (We caught an overstated "auth connected" message once; the user chose accuracy. Keep that standard.)
- Never commit `.env.local`, secrets, or service-role keys. Verify `.gitignore` covers them.

---

## 4. THE MIGRATION-READY RULE (why we build the way we do)

FabVerify will migrate from Supabase to AWS RDS within months. Every architectural choice serves this:

- All DB access through `db.ts` → migration = rewrite one file.
- Standard PostgreSQL only → no Supabase lock-in.
- Environment variables for everything → no hardcoded URLs/keys.
- No Supabase-specific features (realtime, storage paths) hardcoded in components.

If you write code that violates migration-readiness, you are creating future work and future bugs. Flag it if a task seems to require it.

---

## 5. WHAT IS BUILT vs WHAT IS NOT

**Never assume something is built or unbuilt — check `PROJECT_MEMORY.md`.** It is the source of truth for status. As of the last update, the high-level state is:

- **LIVE (real DB):** signup/login (Twilio OTP + localhost dev bypass), manufacturer profiles, discovery, enquiries, orders (place/accept/track), messages/FabChat, sample briefs, verification status.
- **SCREEN-ONLY (fake data):** FabMerch, FabPrice, FabScore display, analytics, most enterprise screens, bulk-order docs beyond core.
- **NOT BUILT:** real escrow (Razorpay/PA partner), QR traceability, FabScore algorithm, WhatsApp notifications, Supabase Storage for photos (currently base64 — temporary), admin verification approval panel, most designed "Fab-" features.

Always confirm against `PROJECT_MEMORY.md` — this list goes stale.

---

## 6. HOW TO HANDLE THE USER

- The user is a domain expert (garment industry, 35+ years family manufacturing, active Fabindia vendor) but is **learning to code**. Explain technical choices in plain language when relevant, but do not condescend.
- The user writes instructions in their own style. Extract intent. If an instruction is ambiguous about *which file* or *what data*, ask one precise question rather than guessing.
- The user cares deeply about the mission (fair treatment of artisans and small manufacturers). When a technical choice touches fairness — credit terms, artisan pay, verification cost — honor the mission.
- Never flatter. Give honest engineering assessments, including when something is a bad idea or already exists.

---

## 7. THE FILE MAP (where truth lives)

| Question | File to read |
|---|---|
| How do I behave? | `CLAUDE.md` (this file) |
| What already exists? | `PROJECT_MEMORY.md` |
| What's decided & locked? | `DECISIONS.md` |
| What are the unbreakable rules? | `CORE.md` |
| What are we building now? | `CURRENT_SPRINT.md`, `TASKS.md` |
| Why does this product exist? | `VISION.md` |
| What are the product rules? | `PRODUCT_PRINCIPLES.md` |
| Who are the users & what do they need? | `docs/PRODUCT/USER_TYPES.md` |
| What's the real DB schema? | `docs/ARCHITECTURE/DATABASE.md` |
| How does module X work? | `docs/MODULES/X.md` |
| How does escrow/verification/etc work? | `docs/OPERATIONS/*.md` |
| What order do we build in? | `ROADMAP.md` |

---

## 8. WHEN YOU FINISH A TASK

1. Confirm `npm run build` passes clean.
2. Update `PROJECT_MEMORY.md` — move the feature from 🔴/🟡 to its new status.
3. Update `CHANGELOG.md` with what changed.
4. If a decision was made, add it to `DECISIONS.md`.
5. Write an accurate commit message.
6. Report to the user: files changed, what works now, what to test.

---

## 9. THE ONE-LINE SUMMARY

> Read the memory, respect the decisions, route every DB call through `db.ts`, validate every input, handle every state, build clean, never hold money, verify for real, and when in doubt — ask.
