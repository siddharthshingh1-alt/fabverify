'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import theme from '../theme'
import content from '../content'
import { useUser } from '../context/UserContext'
import screenConfig from '../config/screens'

export default function LeftPanel() {
  const pathname = usePathname()
  const { user, userLabel, greeting, isSupplySide, isTalent } = useUser()
  const nav = screenConfig.nav[user.userType]

  const analyticsLabel = isSupplySide
    ? 'Business Analytics'
    : isTalent
      ? 'Performance'
      : content.nav.analytics

  const navItems = [
    { href: '/dashboard', label: content.nav.home, icon: '🏠' },
    ...(isSupplySide
      ? [{ href: '/enquiries', label: 'Enquiries', icon: '📬' }]
      : isTalent
        ? [{ href: '/enquiries', label: 'Hire Requests', icon: '📬' }]
        : []),
    { href: '/orders', label: nav.ordersLabel, icon: '📦' },
    { href: '/manufacturers', label: nav.findLabel, icon: '🔍' },
    { href: '/fabmerch', label: nav.fabMerchLabel, icon: '👔' },
    { href: '/credit', label: content.nav.credit, icon: '💳' },
  ]

  const toolItems = [
    { href: '/samples', label: nav.samplesLabel, icon: '📋' },
    { href: '/fabprice', label: content.nav.fabprice, icon: '💰' },
    { href: '/analytics', label: analyticsLabel, icon: '📊' },
  ]

  const fabscoreTitle = isTalent ? 'Your FabTalent Score' : content.fabscore.title

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const navLinkStyle = (href: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: theme.radius.md,
    marginBottom: '2px',
    textDecoration: 'none',
    backgroundColor: isActive(href)
      ? theme.colors.primaryMuted
      : 'transparent',
    borderLeft: isActive(href)
      ? `2px solid ${theme.colors.primary}`
      : '2px solid transparent',
    color: isActive(href)
      ? theme.colors.primary
      : theme.colors.textSecondary,
    fontSize: '14px',
    fontWeight: isActive(href) ? 600 : 400,
    transition: 'all 0.15s ease',
    cursor: 'pointer',
  })

  return (
    <div style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxSizing: 'border-box',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: '24px', paddingTop: '4px' }}>
        <span style={{
          fontFamily: theme.fonts.heading,
          fontWeight: 800,
          fontSize: '20px',
          letterSpacing: '-0.5px',
        }}>
          🧵{' '}
          <span style={{ color: theme.colors.textPrimary }}>Fab</span>
          <span style={{ color: theme.colors.primary }}>Verify</span>
        </span>
      </div>

      {/* User greeting */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          color: theme.colors.textPrimary,
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '6px',
        }}>
          {greeting}, {user.name} 👋
        </div>
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: theme.colors.primaryMuted,
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: theme.radius.pill,
          color: theme.colors.primary,
          fontSize: '11px',
          fontWeight: 600,
        }}>
          {userLabel}
        </span>
      </div>

      {/* Workspace section */}
      <div style={{
        fontSize: '10px',
        color: theme.colors.textSecondary,
        fontWeight: 700,
        letterSpacing: '0.1em',
        marginBottom: '6px',
      }}>
        WORKSPACE
      </div>

      {navItems.map(item => (
        <Link key={item.href} href={item.href}
          style={navLinkStyle(item.href)}>
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Tools section */}
      <div style={{
        fontSize: '10px',
        color: theme.colors.textSecondary,
        fontWeight: 700,
        letterSpacing: '0.1em',
        margin: '16px 0 6px',
      }}>
        TOOLS
      </div>

      {toolItems.map(item => (
        <Link key={item.href} href={item.href}
          style={navLinkStyle(item.href)}>
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      {/* FabScore card */}
      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <div style={{
          padding: '14px',
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
        }}>
          <div style={{
            color: theme.colors.textSecondary,
            fontSize: '11px',
            marginBottom: '4px',
          }}>
            {fabscoreTitle}
          </div>
          <div style={{
            color: theme.colors.primary,
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: theme.fonts.heading,
          }}>
            {content.fabscore.locked}
          </div>
          <div style={{
            color: theme.colors.textSecondary,
            fontSize: '11px',
            marginBottom: '10px',
          }}>
            {content.fabscore.lockedMessage}
          </div>
          <Link href="/verification" style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px',
            background: theme.colors.primary,
            color: theme.colors.background,
            borderRadius: theme.radius.sm,
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: theme.fonts.heading,
          }}>
            {content.verification.getVerified}
          </Link>
        </div>
      </div>
    </div>
  )
}
