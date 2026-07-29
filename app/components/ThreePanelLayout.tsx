'use client'

import React from 'react'
import LeftPanel from './LeftPanel'
import PublicHeader from './PublicHeader'
import { useIsSignedIn } from '../hooks/useIsSignedIn'

interface ThreePanelLayoutProps {
  left?: React.ReactNode
  centre: React.ReactNode
  right: React.ReactNode
}

export default function ThreePanelLayout({
  left = <LeftPanel />,
  centre,
  right
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
    )
  }

  return (
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
  )
}
