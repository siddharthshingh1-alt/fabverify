'use client'

import React from 'react'
import LeftPanel from './LeftPanel'
import MobileBottomNav from './MobileBottomNav'
import PublicHeader from './PublicHeader'
import { useIsSignedIn } from '../hooks/useIsSignedIn'

interface ThreePanelLayoutProps {
  left?: React.ReactNode
  centre: React.ReactNode
  right: React.ReactNode
  /**
   * Opt OUT of the default mobile view, for a page that renders its own
   * `md:hidden` sibling block. Without this the page would render BOTH its
   * bespoke mobile view and the default one, stacked.
   *
   * ⚠️ DEFAULT-ON IS THE WHOLE POINT AND MUST NOT BE INVERTED. Nine
   * dashboards shipped as a blank screen on every phone for months because
   * the mobile half was something each page had to remember to add, and ten
   * of the thirty-three consumers never did. Opting IN would preserve that
   * failure exactly: a new dashboard that forgets the prop would be blank
   * again. Opting OUT means the worst a forgetful page can do is render a
   * plain-but-working mobile view. Same doctrine as the layout's own
   * signed-out branch below — decide chrome HERE, never ask every page to
   * remember.
   */
  mobile?: boolean
}

export default function ThreePanelLayout({
  left = <LeftPanel />,
  centre,
  right,
  mobile = true
}: ThreePanelLayoutProps) {
  const { signedIn } = useIsSignedIn()

  // PUBLIC SHELL — signed-out visitors browsing the manufacturer directory.
  //
  // Only the public discovery and profile pages can reach this branch: every
  // other consumer of this layout sits behind AuthGuard, which bounces a
  // signed-out caller to /login before its children ever mount. So "no
  // session" here reliably means "stranger on a public page".
  //
  // Chrome is decided HERE, in the one component that already owns chrome,
  // rather than asking each page to branch — a page that forgets to branch
  // would leak the workspace frame, the same fail-open shape that let
  // platform routes go unguarded in the first place.
  //
  // Both side panels are dropped. Discovery's right panel is a FabPrice
  // snapshot and suggested manufacturers; the profile's is "Quick Facts",
  // which repeats tier/rating/MOQ already shown in the profile body — so a
  // signed-out visitor loses no information they could not otherwise see.
  if (!signedIn) {
    return (
      <>
        <div
          className="hidden md:flex"
          style={{
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            backgroundColor: '#07122a'
          }}
        >
          <PublicHeader />
          <div
            className="hide-scrollbar"
            style={{
              flex: '1 1 0%',
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            {centre}
          </div>
        </div>

        {/*
          The signed-out shell was blank on phones for the same one-class
          reason as the dashboards. No bottom nav here: navigation is derived
          from the user's persona and a stranger has none — PublicHeader is
          already this branch's chrome.
        */}
        {mobile && (
          <div className="flex min-h-screen flex-col bg-background md:hidden">
            <PublicHeader />
            <div className="flex-1">{centre}</div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
    <div
      className="hidden md:flex"
      style={{
        flexDirection: 'row',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        backgroundColor: '#07122a'
      }}
    >
      {/* LEFT PANEL */}
      <div
        className="hide-scrollbar"
        style={{
          width: '260px',
          minWidth: '260px',
          maxWidth: '260px',
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#0D1B33',
          borderRight: '1px solid #1C3050',
          flexShrink: 0,
          zIndex: 1
        }}
      >
        {left}
      </div>

      {/* CENTRE PANEL */}
      <div
        className="hide-scrollbar"
        style={{
          flex: '1 1 0%',
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1
        }}
      >
        {centre}
      </div>

      {/* RIGHT PANEL */}
      <div
        className="hide-scrollbar"
        style={{
          width: '280px',
          minWidth: '280px',
          maxWidth: '280px',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#0D1B33',
          borderLeft: '1px solid #1C3050',
          flexShrink: 0,
          zIndex: 1
        }}
      >
        {right}
      </div>
    </div>

    {/*
      THE DEFAULT MOBILE VIEW — the fix for nine blank dashboards.

      Deliberately a restack of the SAME `centre` and `right` the desktop
      shell renders, not a re-authored mobile page. That is the pattern
      `enterprise/dashboard` has shipped and proven; `brand/dashboard`
      re-authors its content instead, and copying the heavier of the two
      into nine pages is exactly the drift this default exists to avoid.

      `LeftPanel` is dropped — 260px of fixed-width sidebar cannot restack —
      which is why MobileBottomNav exists. Without it these pages would be
      visible but unnavigable.

      ⚠️ `pb-20` CLEARS THE FIXED NAV. The nav is 64px (h-16); the padding is
      80px. Removing it hides the last card behind the nav on every page at
      once.
    */}
    {mobile && (
      <div className="flex min-h-screen flex-col bg-background pb-20 md:hidden">
        <div className="flex-1">
          {centre}
          {/*
            No padding on the card itself: all ten call sites already wrap
            `right` in a 20px-padded div for the desktop rail, so adding p-4
            here would double it to 36px a side and leave ~275px of content
            on a 375px screen.
          */}
          <div className="px-4 pb-5">
            <div className="mt-4 overflow-hidden rounded-xl border border-border-dark bg-card">
              {right}
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    )}
    </>
  )
}
