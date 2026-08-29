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
