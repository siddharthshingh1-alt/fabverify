/**
 * Lets plain Node import the app's real modules unmodified.
 *
 * Next.js resolves extensionless relative imports ("./supabaseAdmin") via the
 * bundler; Node's ESM resolver requires the extension and throws
 * ERR_MODULE_NOT_FOUND. That single difference is what otherwise forces a
 * security module to be tested through HTTP instead of directly — and an
 * indirect test is exactly what let chunk 2.4's first outage probe look
 * conclusive when it was not (getVerifiedUser answered 503 before the code
 * under test was ever reached).
 *
 * Used by scripts/verify-password-login.ts. Register it with:
 *   node --conditions=react-server --import ./scripts/register-ts-resolve.mjs <script>
 *
 * ⚠️ TEST TOOLING ONLY. Nothing in app/ depends on this, and it changes no
 * behaviour — it only teaches Node a resolution rule the bundler already has.
 */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith(".")) {
      for (const extension of [".ts", ".tsx", "/index.ts"]) {
        try {
          return await next(specifier + extension, context);
        } catch {
          /* try the next candidate */
        }
      }
    }

    // Chunk 2.5b: `auth.ts` imports NextResponse from "next/server", which
    // Next resolves through its own exports map and Node does not. Only the
    // subpath needs the extension — this is the same class of rule as the
    // relative case above, not a behaviour change.
    if (specifier === "next/server") {
      return await next("next/server.js", context);
    }

    throw error;
  }
}
