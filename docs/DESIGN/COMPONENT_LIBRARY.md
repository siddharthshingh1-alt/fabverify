# DESIGN: COMPONENT_LIBRARY
> Reusable UI building blocks. Live in app/components/ui and components/pages.

## CORE COMPONENTS
- LeftPanel (nav + verification badges)
- Cards / surfaces
- Buttons (primary gold, secondary, danger)
- Inputs / forms (controlled)
- State components: Loading (skeleton/spinner), Empty (friendly + path forward), Error (clear + retry)
- Modals via createPortal + mounted guard
- Tables / lists (unique keys always)
- Badges (verification tier, status)
- Bottom sheets (FabChat contact profile)

## SHARED PAGE COMPONENTS (components/pages/*)
DashboardPage, DiscoveryPage, ProfilePage, AnalyticsPage, FabPricePage, etc. — rendered by thin per-user-type route wrappers with a userType prop.

## RULES
Every data component ships with loading/empty/error. Every list has unique keys. Reuse shared components across user types via wrappers (DRY without content-bleeding).
