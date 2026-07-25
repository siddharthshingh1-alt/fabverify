# MODULE: DISCOVERY
> Finding verified partners with real trust signals.

## PURPOSE
Let buyers/enterprises find the right verified partner, and let anyone find the right specialist — filterable, trustworthy, scalable to 10k+ vendors.

## WHAT IT DOES
- Manufacturer discovery (filters: category, city, MOQ, tier, FabScore).
- Search at scale (search UX, not dropdown).
- Planned: fabric mill / trim / artisan / FabTalent discovery (by type + specialisation).

## STATUS
Manufacturer discovery ✅ (real DB, loading/empty states) · search at scale ✅ · other-type discovery 🔴.

## KEY RULES
Show real trust signals (tier, FabScore, reviews, MOQ, capacity). CITY_OPTIONS de-duplicated (the "Lucknow" key bug). Filters must handle large result sets.

## CONNECTS TO
Company Profiles · Identity/Trust (badges) · RFQ (enquire from a result) · FabMerch (find specialists).

## DATA
manufacturer_profiles (is_visible) via /api/manufacturers.
