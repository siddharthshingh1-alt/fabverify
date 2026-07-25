# DESIGN: RESPONSIVE_GUIDE
## PRINCIPLE
FabChat + factory-floor tools are mobile-first. Main platform + enterprise are desktop-first but must not break on mobile (current gap: main platform is desktop-first; many screens need a responsive pass — ONGOING task).

## BREAKPOINTS (guidance)
Mobile (~380px) → single column, bottom nav (FabChat). Tablet → adaptive. Desktop → left panel + content, multi-column.

## RULES
- Modals fit on mobile (portal-rendered, scrollable).
- Touch targets large enough for factory-floor use.
- Tables become cards/stacks on small screens.
- Test artisan/job-worker/FabChat flows on a real cheap phone.

## KNOWN GAP
Main platform desktop-first; responsive pass is an ongoing roadmap task.
