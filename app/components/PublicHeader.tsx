"use client";

import Link from "next/link";
import theme from "../theme";

/**
 * The only chrome a logged-out visitor sees while browsing the public
 * manufacturer directory. Deliberately minimal: identity, and a way in.
 *
 * Replaces LeftPanel for signed-out visitors, which otherwise showed a
 * stranger the inside of somebody's workspace — "Good morning, 👋", a
 * FabScore card, navigation to pages they'd be bounced from, and a Sign Out
 * button for a session they never had.
 *
 * This is the MINIMAL version, not a designed storefront. A real public
 * marketplace landing experience is tracked separately in TASKS.md
 * ("Public Marketplace / Growth").
 */
export default function PublicHeader() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
        flexShrink: 0,
        padding: "0 24px",
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: theme.fonts.heading,
          fontSize: "17px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        <span>🧵</span>
        <span style={{ color: "#ffffff" }}>Fab</span>
        <span style={{ color: theme.colors.primary }}>Verify</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          href="/login"
          style={{
            padding: "8px 16px",
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textPrimary,
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            fontFamily: theme.fonts.heading,
          }}
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          style={{
            padding: "8px 16px",
            borderRadius: theme.radius.md,
            background: theme.colors.primary,
            color: theme.colors.background,
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: theme.fonts.heading,
          }}
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
