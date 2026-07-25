# DESIGN: COLORS
> The locked palette. Use theme.ts tokens, never hardcode.

## CORE
- Background: #07122a (deep navy)
- Cards / surfaces: #0D1B33
- Borders / dividers: #1C3050
- Gold accent (primary action, highlights): #f2ca50
- Text primary: #E2E8F0
- Text secondary / muted: #7A8FA8
- Danger / error: #e34948

## USAGE
- Gold is the accent — actions, key highlights, verification-gold tier. Don't overuse.
- Tiers: Bronze / Silver / Gold verification badges use their metal colors.
- Status: green (on-track/verified), amber (at-risk/pending), red (#e34948, delayed/error).

## RULE
All colors come from app/theme.ts. Hardcoded hex in components is tech debt (X4) — sweep when touched so a one-file theme swap works.
