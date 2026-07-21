'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import theme from '../theme'
import content from '../content'
import { useUser } from '../context/UserContext'
import type { Position, UserType } from '../context/UserContext'
import screenConfig from '../config/screens'
import { getBasePath, getOrdersSlug, getDiscoverySlug } from '../lib/routing'
import { getUnreadCount } from '../chat/data'

type NavItem = { href: string; icon: string; label: string }

const HAS_SAMPLES: UserType[] = ['buyer', 'manufacturer', 'fabric_mill', 'trim_supplier']
const HAS_ANALYTICS: UserType[] = [
  'buyer', 'manufacturer', 'fabric_mill', 'trim_supplier', 'artisan', 'job_worker', 'designer',
]

// Buyer sub-positions link into the already-separate /enterprise/* section and
// /brand/* (their own base path is always '/brand' since this nav only ever
// applies to userType 'buyer').
const POSITION_NAV: Partial<Record<Position, NavItem[]>> = {
  md_ceo: [
    { icon: '🏠', label: 'Home', href: '/brand/dashboard' },
    { icon: '📊', label: 'Season Overview', href: '/enterprise/analytics' },
    { icon: '⚠', label: 'Exceptions', href: '/brand/orders' },
    { icon: '👥', label: 'My Team', href: '/enterprise/team' },
    { icon: '📈', label: 'Analytics', href: '/enterprise/analytics' },
  ],
  head_operations: [
    { icon: '🏠', label: 'Home', href: '/brand/dashboard' },
    { icon: '📦', label: 'All Orders', href: '/brand/orders' },
    { icon: '🏭', label: 'Vendors', href: '/enterprise/vendors' },
    { icon: '📊', label: 'Analytics', href: '/enterprise/analytics' },
    { icon: '⚠', label: 'Exceptions', href: '/brand/orders' },
  ],
  merchandiser: [
    { icon: '🏠', label: 'Home', href: '/brand/dashboard' },
    { icon: '📦', label: 'My Orders', href: '/brand/orders' },
    { icon: '📋', label: 'Sample Briefs', href: '/brand/samples' },
    { icon: '🔍', label: 'Find Manufacturers', href: '/brand/manufacturers' },
    { icon: '👔', label: 'FabMerch', href: '/brand/fabmerch' },
    { icon: '💰', label: 'FabPrice', href: '/brand/fabprice' },
  ],
  designer: [
    { icon: '🏠', label: 'Home', href: '/brand/dashboard' },
    { icon: '✏️', label: 'My Styles', href: '/brand/orders' },
    { icon: '📋', label: 'Tech Packs', href: '/brand/samples' },
    { icon: '🔍', label: 'Find Manufacturers', href: '/brand/manufacturers' },
    { icon: '🎨', label: 'FabMerch', href: '/brand/fabmerch' },
  ],
  accounts: [
    { icon: '🏠', label: 'Home', href: '/brand/dashboard' },
    { icon: '💳', label: 'Payments', href: '/brand/orders' },
    { icon: '📊', label: 'Budget', href: '/brand/analytics' },
    { icon: '🧾', label: 'Invoices', href: '/brand/credit' },
    { icon: '📈', label: 'Analytics', href: '/brand/analytics' },
  ],
}

export default function LeftPanel() {
  const pathname = usePathname()
  const { user, userLabel, greeting, isSupplySide, isTalent, mounted } = useUser()
  const leftNav = screenConfig.leftNav[user.userType]
  const basePath = getBasePath(user.userType)
  const ordersSlug = getOrdersSlug(user.userType)
  const discoverySlug = getDiscoverySlug(user.userType)

  const positionNav =
    mounted && user.userType === 'buyer' && user.position
      ? POSITION_NAV[user.position]
      : undefined

  const unreadMessages = mounted ? getUnreadCount(user.userType, Boolean(user.position)) : 0

  // Manufacturer/mill/supplier/artisan/job-worker have no fabmerch route of
  // their own — "Book QC Inspector" reuses the brand's shared marketplace.
  // Talent types don't book talent, they *are* the talent, so this nav slot
  // becomes "My FabTalent" pointing at their own profile.
  const fabmerchHref = user.userType === 'buyer'
    ? `${basePath}/fabmerch`
    : isTalent
      ? `${basePath}/profile`
      : '/brand/fabmerch'

  const navItems: NavItem[] = positionNav ?? [
    { href: `${basePath}/dashboard`, icon: '🏠', label: content.nav.home },
    ...(isSupplySide || isTalent
      ? [{ href: `${basePath}/enquiries`, icon: '📬', label: 'Enquiries' }]
      : []),
    { href: `${basePath}/${ordersSlug}`, icon: '📦', label: leftNav.ordersLabel },
    ...(user.userType === 'buyer'
      ? [{ href: '/brand/orders/new', icon: '📦', label: 'Place Order' }]
      : []),
    { href: `${basePath}/${discoverySlug}`, icon: '🔍', label: leftNav.manufacturersLabel },
    { href: fabmerchHref, icon: '👔', label: leftNav.fabmerchLabel },
    { href: `${basePath}/credit`, icon: '💳', label: content.nav.credit },
  ]

  const toolItems: NavItem[] = positionNav
    ? []
    : [
        ...(HAS_SAMPLES.includes(user.userType)
          ? [{ href: `${basePath}/samples`, icon: '📋', label: leftNav.samplesLabel }]
          : []),
        { href: `${basePath}/fabprice`, icon: '💰', label: content.nav.fabprice },
        ...(HAS_ANALYTICS.includes(user.userType)
          ? [{
              href: `${basePath}/analytics`,
              icon: '📊',
              label: isSupplySide
                ? 'Business Analytics'
                : isTalent
                  ? 'Performance'
                  : 'Analytics',
            }]
          : []),
      ]

  const fabscoreTitle = isTalent ? 'Your FabTalent Score' : content.fabscore.title
  const fabscoreLockedMessage = isTalent
    ? 'Complete your first project to unlock'
    : content.fabscore.lockedMessage
  const fabscoreVerifyLabel = isTalent
    ? 'Get FabTalent Verified'
    : content.verification.getVerified

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
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: `2px solid ${theme.colors.primary}`,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          fontFamily: theme.fonts.heading,
          fontWeight: 700,
          fontSize: '14px',
          color: theme.colors.primary,
        }}>
          {mounted && user.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profilePhoto}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            (mounted ? user.name : 'U').charAt(0).toUpperCase()
          )}
        </div>

        <div>
          <div style={{
            color: theme.colors.textPrimary,
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '6px',
          }}>
            {mounted ? greeting : 'Good morning'}, {user.name} 👋
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
            {mounted ? userLabel : 'Member'}
          </span>
        </div>
      </div>

      {/* FabChat — the separate mobile-first chat experience at /chat */}
      <Link href="/chat" style={{
        display: 'block',
        padding: '10px 12px',
        borderRadius: theme.radius.md,
        marginBottom: '14px',
        textDecoration: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: theme.colors.primary,
            fontSize: '14px',
            fontWeight: 600,
          }}>
            <span>💬</span>
            <span>FabChat ↗</span>
          </span>
          {unreadMessages > 0 && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '9999px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
            }}>
              {unreadMessages}
            </span>
          )}
        </div>
        <div style={{ marginTop: '2px', paddingLeft: '26px', color: theme.colors.textSecondary, fontSize: '10px' }}>
          Opens on mobile too
        </div>
      </Link>

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
        <Link key={item.label} href={item.href}
          style={navLinkStyle(item.href)}>
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Tools section */}
      {toolItems.length > 0 && (
        <div style={{
          fontSize: '10px',
          color: theme.colors.textSecondary,
          fontWeight: 700,
          letterSpacing: '0.1em',
          margin: '16px 0 6px',
        }}>
          TOOLS
        </div>
      )}

      {toolItems.map(item => (
        <Link key={item.label} href={item.href}
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
            {fabscoreLockedMessage}
          </div>
          <Link href={`${basePath}/verification`} style={{
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
            {fabscoreVerifyLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
