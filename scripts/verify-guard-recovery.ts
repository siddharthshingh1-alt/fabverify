/**
 * VERIFY: the guard safety net (Part 1 of the blank-screen fix).
 *
 * Run:  node --import ./scripts/register-ts-resolve.mjs scripts/verify-guard-recovery.ts
 *
 * ⚠️ WHAT THIS CAN AND CANNOT PROVE. The loop budget and the recovery are pure
 * logic and are proven here. The TIMING behaviour (null for 600ms, then
 * spinner, then error) is React rendering in a browser and HTTP cannot
 * exercise it — same limitation verify-login-wiring.ts records for AuthGuard.
 * That half is proven by the browser checklist on a NON-ENTERPRISE account.
 */

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

// ── storage shims ────────────────────────────────────────────────────────
class MemStore {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  get size() { return this.m.size; }
  keys() { return [...this.m.keys()]; }
}
class ThrowingStore {
  getItem(): string { throw new Error("blocked"); }
  setItem() { throw new Error("blocked"); }
  removeItem() { throw new Error("blocked"); }
}

let navigatedTo: string | null = null;
const g = globalThis as unknown as Record<string, unknown>;
g.sessionStorage = new MemStore();
g.localStorage = new MemStore();
g.window = { get location() { return { set href(v: string) { navigatedTo = v; } }; } };
Object.defineProperty(g.window, "location", {
  value: { set href(v: string) { navigatedTo = v; }, get href() { return navigatedTo ?? ""; } },
  writable: true,
});

const mod = await import("../app/lib/guardRecovery.ts");
const { claimGuardRedirect, clearGuardRedirects, recoverToLogin,
        armGuardStuckTimer,
        GUARD_SPINNER_AFTER_MS, GUARD_STUCK_AFTER_MS } = mod;

console.log("\n[A] TIMING CONSTANTS — the fast path must be preserved");
check("spinner delay > 0 (no flash on normal navigation)", GUARD_SPINNER_AFTER_MS > 0);
check("spinner delay >= 400ms (a normal nav resolves well inside it)", GUARD_SPINNER_AFTER_MS >= 400);
check("stuck threshold is strictly after the spinner", GUARD_STUCK_AFTER_MS > GUARD_SPINNER_AFTER_MS);
check("stuck threshold under 5s (a user will not wait longer)", GUARD_STUCK_AFTER_MS <= 5000);

console.log("\n[B] LOOP BUDGET — redirects inside the window");
clearGuardRedirects();
const first4 = [claimGuardRedirect(), claimGuardRedirect(), claimGuardRedirect(), claimGuardRedirect()];
check("first 4 redirects are allowed", first4.every(Boolean));
check("the 5th is refused (budget exhausted)", claimGuardRedirect() === false);
check("it stays refused while the window is open", claimGuardRedirect() === false);

console.log("\n[C] CLEARING — ordinary navigation must never accumulate");
clearGuardRedirects();
check("after a successful resolve, redirects are allowed again", claimGuardRedirect() === true);
clearGuardRedirects();
for (let i = 0; i < 3; i++) { claimGuardRedirect(); clearGuardRedirects(); }
check("3 redirect+resolve cycles never trip the budget", claimGuardRedirect() === true);

console.log("\n[D] WINDOW EXPIRY — a slow trickle is not a loop");
clearGuardRedirects();
for (let i = 0; i < 5; i++) claimGuardRedirect();
check("budget is tripped", claimGuardRedirect() === false);
const rec = JSON.parse((g.sessionStorage as MemStore).getItem("fabverify_guard_redirects")!);
(g.sessionStorage as MemStore).setItem("fabverify_guard_redirects",
  JSON.stringify({ ...rec, since: Date.now() - 10_000 }));
check("once the window has passed, redirects are allowed again", claimGuardRedirect() === true);

console.log("\n[E] RECOVERY — the terminal exit");
const local = g.localStorage as MemStore;
["fabverify_auth","fabverify_profile","fabverify_user","fabverify_user_type",
 "userType","fabverify_position","fabverify_enterprise","fabverify_enterprise_position"]
  .forEach((k) => local.setItem(k, "x"));
local.setItem("unrelated_key", "keep-me");
clearGuardRedirects();
claimGuardRedirect();
navigatedTo = null;
recoverToLogin("test-reason");
check("navigates to /login", (navigatedTo ?? "").startsWith("/login"));
check("carries the reason in the URL", (navigatedTo ?? "").includes("recovered=test-reason"));
check("clears every identity mirror", local.keys().filter(k => k.startsWith("fabverify_") || k === "userType").length === 0);
check("leaves unrelated keys alone", local.getItem("unrelated_key") === "keep-me");
check("clears the loop budget so /login is not another lap",
  (g.sessionStorage as MemStore).getItem("fabverify_guard_redirects") === null);

// -------------------------------------------------------------------------
// [G] WHEN THE STUCK TIMER FIRES - the assertions that were MISSING.
//
// This section exists because its absence shipped a regression. The first cut
// of this suite was 18/18 green while the guards contained a defect that
// signed users out 2.5s after a SUCCESSFUL resolve. Every assertion tested
// WHAT recoverToLogin does; none tested WHEN it is called. A green suite that
// does not cover the risky part buys false confidence, which is worse than no
// suite at all.
//
// The timing lives in armGuardStuckTimer precisely so it can be asserted here
// without React. `delayMs` is a parameter so these run in milliseconds.
// -------------------------------------------------------------------------
console.log("");
console.log("[G] STUCK TIMER - fires ONLY when genuinely undecided");
const D = 40;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

g.sessionStorage = new MemStore();
g.localStorage = new MemStore();

navigatedTo = null;
const t1 = armGuardStuckTimer("should-not-fire", D);
t1.settle();
await wait(D * 3);
check("settled timer does NOT navigate (THE REGRESSION ASSERTION)", navigatedTo === null);
check("settle() records the decision", t1.isSettled === true);

navigatedTo = null;
armGuardStuckTimer("should-fire", D);
await wait(D * 3);
check("un-settled timer DOES navigate (safety net still works)", (navigatedTo ?? "").includes("recovered=should-fire"));

navigatedTo = null;
const t3 = armGuardStuckTimer("cancelled", D);
t3.cancel();
await wait(D * 3);
check("cancelled timer does NOT navigate (unmount path)", navigatedTo === null);

navigatedTo = null;
const t4 = armGuardStuckTimer("double-settle", D);
t4.settle();
t4.settle();
await wait(D * 3);
check("settle() is idempotent and still does not fire", navigatedTo === null);

navigatedTo = null;
const t5 = armGuardStuckTimer("late-settle", D);
await wait(D * 3);
const firedAt = navigatedTo;
t5.settle();
check("settling AFTER it fired does not undo or re-fire", navigatedTo === firedAt && (firedAt ?? "").includes("late-settle"));

// The exact shape of the shipped bug: decide immediately, then sit on the page
// far longer than the threshold, with no re-render and no unmount.
navigatedTo = null;
const t6 = armGuardStuckTimer("dashboard-sit", D);
t6.settle();
await wait(D * 8);
check("a resolved guard survives a long idle page view (THE SHIPPED SYMPTOM)", navigatedTo === null);

// -------------------------------------------------------------------------
// [H] THE PASSWORD-GATE MIRROR MUST NOT SURVIVE RECOVERY.
//
// Found by a real sign-out check on 2026-08-30: localStorage was empty EXCEPT
// for fabverify_has_password. clearPasswordGate() had existed since chunk 2.6b
// and was called by nothing. recoverToLogin shared the same omission.
//
// Not a bypass -- the gate is re-derived from the server at login and on every
// app entry -- but it leaked whether the last user on the device had a
// password, and it widened the fail-open window while the status endpoint is
// unreachable.
// -------------------------------------------------------------------------
console.log("");
console.log("[H] PASSWORD-GATE MIRROR - cleared by recovery");
g.sessionStorage = new MemStore();
g.localStorage = new MemStore();
const ls = g.localStorage as MemStore;

ls.setItem("fabverify_auth", "x");
ls.setItem("fabverify_profile", "x");
ls.setItem("fabverify_has_password", "1");
ls.setItem("unrelated_key", "keep-me");
navigatedTo = null;
recoverToLogin("mirror-test");
check("fabverify_has_password is cleared by recoverToLogin", ls.getItem("fabverify_has_password") === null);
check("no fabverify_* key survives recovery", ls.keys().filter((k) => k.startsWith("fabverify_")).length === 0);
check("unrelated keys still survive", ls.getItem("unrelated_key") === "keep-me");

// A "0" (definitely has none) must clear too -- not just the "1" case.
ls.setItem("fabverify_has_password", "0");
navigatedTo = null;
recoverToLogin("mirror-test-zero");
check("the \"0\" state is cleared as well as \"1\"", ls.getItem("fabverify_has_password") === null);

console.log("\n[F] STORAGE BLOCKED — a guard must never throw");
g.sessionStorage = new ThrowingStore();
let threw = false;
try { claimGuardRedirect(); clearGuardRedirects(); } catch { threw = true; }
check("claim/clear degrade silently when sessionStorage throws", !threw);
g.localStorage = new ThrowingStore();
navigatedTo = null;
let threw2 = false;
try { recoverToLogin("blocked-storage"); } catch { threw2 = true; }
check("recovery still navigates when localStorage throws", !threw2 && (navigatedTo ?? "").startsWith("/login"));

console.log(`\n──────── ${pass}/${pass + fail} ────────`);
if (fail > 0) process.exit(1);

// Top-level await above requires this file to be a MODULE. It has only a
// dynamic import(), which does not make it one, so the build type-check fails
// without this line. (Caught by a clean rebuild after the file was added.)
export {};
