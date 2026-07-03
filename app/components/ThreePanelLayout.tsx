'use client'

import React from 'react'
import LeftPanel from './LeftPanel'

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
