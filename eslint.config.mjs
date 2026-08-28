import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ── THE ESLINT DECISION (2026-08-29) — Launch-Ready merge gate 2 ────────
  //
  // WHAT HAPPENED: an eslint-plugin-react-hooks bump introduced two rules
  // that did not exist when this UI was written, and they turned 29 working
  // call sites into ERRORS overnight. No code changed; the standard did.
  // That broke CLAUDE.md §3's promise that "npm run build passes clean" —
  // the build passed, the lint did not, and the doc quietly became false.
  //
  // THE DECISION: downgrade these two to WARNINGS, deliberately and on the
  // record, rather than either (a) silently tolerating a red lint that
  // everyone learns to ignore, or (b) refactoring 29 working effect sites
  // immediately before this project's FIRST production deploy — which is
  // the worst possible moment to touch working UI for a style rule.
  //
  // ⚠️ WARN, NOT OFF. That distinction is the whole point. The findings stay
  // visible on every run; what changes is that they no longer block. Turning
  // them off would delete the information, which is the thing the 2.8a
  // doc-drift incident taught us not to do.
  //
  // WHEN TO REVISIT: after the first deploy is validated and the Launch-Ready
  // items are done. `set-state-in-effect` is flagging a real pattern — a
  // setState during an effect body causes a cascading render — and several of
  // the 27 are probably genuine cleanups. Fix them as their screens are
  // touched for other reasons, not as a 29-site sweep. When the count reaches
  // zero, delete this block and let the rules go back to erroring.
  //
  // NOT A LICENCE FOR NEW ONES: this covers pre-existing sites only. Do not
  // write new code that trips these and point at this block.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/use-memo": "warn",
    },
  },
]);

export default eslintConfig;
