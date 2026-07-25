# FOLDER_STRUCTURE.md
### The Codebase Layout
> Where things live in the FabVerify Next.js app. Local path: `C:\Users\sidda\Desktop\fabverify`. This describes the app repo, not this documentation set. Confirm against the real tree when in doubt — this is the intended structure.

---

## TOP LEVEL
```
fabverify/
├── app/                    # Next.js App Router — all routes, pages, API
├── public/                 # static assets
├── supabase/
│   └── schema.sql          # DB schema + RLS (source of truth for structure)
├── .env.local              # secrets (gitignored — NEVER commit)
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

## app/ — THE HEART
```
app/
├── lib/
│   ├── db.ts               # ★ THE single DB gateway — all DB access here (T1)
│   ├── supabase.ts         # Supabase client (only other file importing Supabase)
│   ├── theme.ts            # design tokens (colors, fonts) — X4 sweep pending
│   └── helpers.ts          # getErrorMessage(), formatters, shared utils
│
├── components/
│   ├── pages/              # ★ shared page components rendered by per-type wrappers
│   │   ├── DashboardPage.tsx
│   │   ├── DiscoveryPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── FabPricePage.tsx
│   │   └── ...
│   ├── LeftPanel.tsx        # nav + verification badges
│   ├── modals/              # createPortal modals
│   └── ui/                  # buttons, inputs, cards, states (loading/empty/error)
│
├── api/                     # server-side API routes
│   ├── orders/route.ts               # GET/POST
│   ├── orders/[id]/route.ts          # GET/PATCH (await params)
│   ├── messages/route.ts
│   ├── conversations/route.ts
│   ├── messages/read/route.ts
│   ├── sample-briefs/route.ts
│   ├── sample-briefs/[id]/route.ts
│   ├── verification/route.ts
│   ├── manufacturers/route.ts
│   ├── enquiries/route.ts
│   ├── dev-auth/lookup/route.ts      # phone → profile (service-role)
│   └── waitlist/route.ts
│
├── (public user-type route trees) — thin wrappers → components/pages/*
│   ├── brand/{dashboard,discovery,orders,orders/new,briefs,chat,...}/page.tsx
│   ├── manufacturer/{dashboard,discovery,enquiries,briefs,orders,...}/page.tsx
│   ├── mill/{dashboard,...}/page.tsx
│   ├── supplier/{dashboard,...}/page.tsx
│   ├── artisan/{dashboard,...}/page.tsx
│   ├── jobworker/{dashboard,...}/page.tsx
│   └── talent/{designer,master,merchandiser,qc}/{dashboard,...}/page.tsx
│
├── enterprise/             # SEPARATE enterprise interface
│   ├── dashboard/page.tsx           # position-adaptive (CEO money-first — TODO)
│   ├── team/page.tsx                # + member work-dashboard modal
│   ├── vendors/page.tsx
│   ├── orders/page.tsx              # Kanban
│   ├── analytics/page.tsx
│   ├── season/page.tsx
│   └── enquiries/page.tsx
│
├── chat/                   # FabChat mobile (per-user-type: /chat/brand, etc.)
│   ├── [userType]/page.tsx          # 3-tab shell (Chats/Orders/Scan)
│   └── components/                  # voice notes, camera, contact sheet, ChatAuthGuard
│
├── invite/[token]/page.tsx # enterprise invitation acceptance
├── verification/identity/  # verification wizard (India + international)
├── onboarding/{type,profile}/page.tsx
├── login/page.tsx
├── signup/page.tsx
├── dashboard/page.tsx      # smart redirect → correct per-type tree
├── layout.tsx
└── page.tsx                # landing
```

## THE PATTERN (per-user-type routing)
A route like `app/brand/dashboard/page.tsx` is a **thin wrapper**:
1. Reads the user type (from auth/localStorage/profile).
2. If the user is the wrong type → redirect to their correct tree.
3. Renders the shared `components/pages/DashboardPage` with `userType="brand_buyer"`.

This gives DRY (one shared component) without content-bleeding (each type has its own URL). See A5/A6.

## WHERE NEW THINGS GO
- **New DB access** → a function in `app/lib/db.ts` (never a direct Supabase call elsewhere).
- **New privileged/cross-user op** → an `app/api/*` route using service-role via a helper.
- **New shared screen** → `app/components/pages/*` + thin per-type wrappers.
- **New user-type-specific screen** → that type's route tree, rendering a shared component where possible.
- **New entity** → table in `supabase/schema.sql` (+ `DATABASE.md`), db.ts functions, then UI.
- **New design token** → `app/theme.ts` (and sweep hardcoded colors when touched).

## GITIGNORE MUST COVER
`.env.local`, `.env*`, `node_modules/`, `.next/`, any file containing secrets or the service-role key.
