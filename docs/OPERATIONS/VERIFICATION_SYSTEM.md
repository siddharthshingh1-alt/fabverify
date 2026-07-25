# OPERATIONS: VERIFICATION_SYSTEM
> How verification runs operationally.

## FLOW
Country selector (India / Global) → identity check → business check → tier assignment → (Silver/Gold) admin review → status stored → gates escrow.

## INDIA
Aadhaar (DigiLocker consent, status not number) + PAN (CBDT) + GST (validity + filing) + Udyam/MSME (name/category/address/date, 99.9% success) + CIN/MCA (company/director). Cross-linked to one entity.

## GLOBAL
Passport + selfie (liveness) + country registration (UK Companies House / EU VAT / US EIN / UAE Trade Licence) — more manual, 2–3 day review.

## TIERS
Bronze (identity, instant/auto) → Silver (business, 2–3d) → Gold (physical audit + video + compliance, EU-ready).

## OPS TASKS
Admin approval panel (Silver/Gold), provider API monitoring, consent audit trail, re-verification cadence, spot-checks.

## RULES
Real data only (M6); store status not raw IDs; consent required; verification gates money (M5,M7); tier syncs to manufacturer_profiles (M9).
