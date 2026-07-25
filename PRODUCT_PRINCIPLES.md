# PRODUCT_PRINCIPLES.md
### How We Decide What to Build and How It Should Feel
> When a feature decision is ambiguous, these principles break the tie. They are the "taste" of FabVerify. Architecture rules live in `CORE.md`; this file is about product judgment.

---

## THE NORTH STAR

> **Make the weaker party stronger.** In every interaction, the person with less power — the artisan, the small manufacturer, the first-time founder — should come out ahead. If a feature quietly advantages the powerful over the vulnerable, redesign it.

Everything below serves this.

---

## PRINCIPLE 1 — FAIR BY DESIGN

Fairness is not a feature; it is the architecture.
- The artisan's share is the **largest** in the chain, shown transparently every month ("you earned ₹X directly; a middleman would have taken ₹Y").
- Credit shows one honest APR, no hidden charges, no prepayment penalty. We would rather earn less than trap someone.
- Pricing is transparent both ways: the buyer sees what the maker is paid; the maker sees what the buyer pays.
- Verification cost never locks out the small player — Bronze is instant and accessible; you pay more only to unlock more.

**Test:** If a moneylender or exploitative middleman would be comfortable with how a feature works, we built it wrong.

---

## PRINCIPLE 2 — TRUST IS EARNED WITH PROOF, NOT CLAIMS

FabVerify's entire reason to exist is replacing "trust me" with "here's proof."
- Verification is real government data, never self-declaration.
- Production is verified with geo-tagged, timestamped, photographic evidence.
- Money releases on proof, not promises.
- A badge, a FabScore, an "approved" status must always mean something verifiable behind it.

**Test:** For any trust signal we show, ask "what real evidence backs this?" If the answer is "the user said so," it's not trustworthy yet.

---

## PRINCIPLE 3 — DON'T ACCUSE; SURFACE AND ASK

The verification engine catches fraud, but it must never make an honest person feel accused.
- Normal variation (10–20 pieces, 3–5% fabric loss) is silent — no alert at all.
- Small anomalies get a soft internal note, not a buyer notification.
- Only genuinely impossible discrepancies escalate — and even then the message is "please confirm / did you run overtime?" not "you lied."
- An honest user should be able to work for months and never see a flag.

**Test:** Would a hardworking, honest karigar or manufacturer feel respected by this flow, even on an off day? If not, loosen it.

---

## PRINCIPLE 4 — MEET USERS WHERE THEY ARE

Our users range from a home-based woman artisan on a ₹6,000 phone to a CFO at a desk.
- Artisan/factory-floor tools work on basic phones, in local language, with voice (FabVoice, Hindi), usable in 30 seconds between other work.
- The hardest expert skills (costing, capacity, compliance) are done BY the platform; the user only provides what they know.
- Inventory managers find things by looking at photos, not by remembering codes.
- Enterprise users get depth and control; beginners get guidance and guardrails — from the same platform, revealed progressively.

**Test:** Could the least tech-savvy intended user of this feature succeed on their first try, on a cheap phone, without help? If not, simplify.

---

## PRINCIPLE 5 — GUIDE BEGINNERS, EMPOWER EXPERTS

The same feature serves both by adapting depth, not by dumbing down.
- Beginners get a guided journey that won't let them make fatal mistakes (skip sampling, order at a suicidal margin, over-order into dead stock).
- Experts get full manual control, reverse-costing, side-by-side comparison, and no hand-holding they didn't ask for.
- Quick mode and detailed mode of the same tool, not two different tools.

**Test:** Does a first-timer feel safely guided AND a veteran feel unencumbered? Both must be true.

---

## PRINCIPLE 6 — THE DASHBOARD SHOWS WHAT NEEDS ATTENTION NOW

A dashboard is not a menu.
- It shows what needs a decision today, what's at risk, what's stuck — not cards that duplicate the left-panel navigation.
- The CEO's default view is money and profit first, then one tap into any department.
- Every user opens the app and immediately knows the one or two things that need them right now.

**Test:** If the dashboard just repeats the nav, delete the duplicate cards and show real status instead.

---

## PRINCIPLE 7 — ONE PHYSICAL THING, ONE IDENTITY

Names lie; specifications and physical reality don't.
- Every physical item (fabric, trim, style) has one master identity with unlimited aliases.
- Matching is by barcode or spec-fingerprint, not by whatever anyone typed as a name.
- This is what makes reserve, reorder, and enterprise inventory reconciliation actually work.

**Test:** Could two people calling the same button different names still be recognized as the same button? They must be.

---

## PRINCIPLE 8 — DELEGATE WITH CONTROL

When work is handed to someone (a freelancer, a team member), give them exactly the access they need and no more — and keep approval where power belongs.
- Scoped access: they see only what the gig requires.
- Propose-by-default: nothing commits without the owner's approval.
- Money and irreversible actions are never delegable.

**Test:** Could granting this access ever let someone move money or cause irreversible harm without the owner's explicit approval? If yes, gate it harder.

---

## PRINCIPLE 9 — EVERYTHING CONNECTS (ONE CHAIN, NOT ISLANDS)

FabVerify's power is that the pieces link.
- A tech pack flows into the sample, into the order, into production, into QC, into the QR chain, into the Digital Product Passport.
- A fabric dye lot is the first node that a finished garment can be traced back to.
- Costing pulls real prices from real listings; capacity uses the same SMV the verification engine uses.
- A completed gig feeds the freelancer's portfolio and FabScore automatically.

**Test:** Does this feature stand alone, or does it connect to the chain? Prefer connection. Islands are wasted power.

---

## PRINCIPLE 10 — HONEST ABOUT WHAT'S REAL

We never fake capability to look better.
- Screen-only features are clearly not pretending to be live.
- Dev-mode and simulated flows are labeled.
- Commit messages describe what actually changed.
- We tell users the honest status — including limitations — rather than overstating.

**Test:** Are we implying a capability we don't actually have? If yes, label it or build it.

---

## PRINCIPLE 11 — MIGRATION-READY AND LEAN FOREVER

Product choices respect the business reality that killed our predecessors.
- No feature requires holding inventory.
- No feature requires a huge human-ops team to run; automate what Zilingo hired hundreds for.
- No architectural choice locks us to one vendor.
- Enterprise SaaS depth is prioritized because it's the profit engine.

**Test:** Does this feature add inventory risk, heavy manual ops, or vendor lock-in? If yes, reconsider.

---

## PRINCIPLE 12 — CALM, CLEAR, DIGNIFIED TONE

The product speaks to people who have often been disrespected by the systems around them.
- Plain language, local language, no jargon walls.
- Dignified, never patronizing — especially to artisans and small makers.
- Errors explain and offer a path, never blame.
- Celebrate real wins ("you earned the largest share this month") sincerely, not with hype.

**Test:** Would this copy feel respectful to a master craftsperson who has practiced for 30 years? Write to that standard.

---

## HOW TO USE THESE PRINCIPLES

1. When two designs are both technically fine, pick the one that better serves the North Star and the principles.
2. When a user request conflicts with a principle (e.g. "add a hidden fee to credit"), flag the conflict and the principle, and discuss — don't silently comply or silently refuse.
3. When adding a feature, name which principles it serves. If it serves none, question why it exists.

---

## THE ONE-LINE SUMMARY

> Make the weaker party stronger; back every trust signal with proof; guide beginners and empower experts from one adaptive product; surface problems without accusing; connect everything into one chain; and stay fair, honest, lean, and migration-ready — always.
