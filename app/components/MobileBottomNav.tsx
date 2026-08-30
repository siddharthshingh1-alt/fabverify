'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '../context/UserContext'
import type { UserType } from '../context/UserContext'
import { getBasePath, getOrdersSlug, getDiscoverySlug } from '../lib/routing'

/**
 * The bottom navigation for the DEFAULT mobile dashboard view.
 *
 * WHY THIS EXISTS AT ALL: `LeftPanel` is the only navigation the marketplace
 * and talent dashboards have, and the mobile view drops it. Without this a
 * phone user can see their dashboard and go nowhere — visible but not
 * usable, which is barely better than the blank screen it replaces.
 *
 * ⚠️ EVERY HREF HERE IS VERIFIED TO EXIST FOR ALL TEN PERSONAS. That was not
 * free: `screenConfig.leftNav` carries a `fabmerchLabel` and a `samplesLabel`
 * for every persona, but **the routes behind them do not exist for most of
 * them** — only `/brand` has `fabmerch`, and only buyer/manufacturer/mill/
 * supplier have `samples` (`LeftPanel`'s own `HAS_SAMPLES` and `fabmerchHref`
 * exist precisely to paper over that). A nav built naively from the config
 * would 404 on most personas, which is worse than no nav. The five slots
 * below were each checked against the filesystem: `dashboard`, the persona's
 * orders slug, the persona's discovery slug, `enquiries` and `profile` all
 * resolve for all ten.
 *
 * ⚠️ `fabmerch` IS DELIBERATELY NOT HERE, even though LeftPanel carries it.
 * `LeftPanel`'s `fabmerchHref` resolves to `${basePath}/profile` for talent
 * types — which would make slots 4 and 5 the same destination on four of the
 * ten personas. `enquiries` is the incoming-work screen, exists everywhere,
 * and is what a supply-side or talent user actually wants to reach.
 */

// The slugs double as labels, which is why there is no second taxonomy to
// keep in sync: 'orders' → Orders, 'projects' → Projects, 'jobs' → Jobs.
// Only the buyer's discovery slug ('manufacturers') is too long for a 10px
// label in a fifth of a 375px screen, so it gets the generic verb.
const SHORT_DISCOVERY: Partial<Record<UserType, string>> = {
  buyer: 'Discover',
}

const titleCase = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1)

export default function MobileBottomNav() {
  const { user, mounted } = useUser()
  const pathname = usePathname()

  // Reserve the space before hydration rather than rendering nothing. The
  // parent pads its scroll area for a nav of this exact height, so returning
  // null here would leave a gap on first paint and then shift the page.
  if (!mounted) {
    return (
      <nav
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 h-16 border-t border-border-dark bg-card"
      />
    )
  }

  const basePath = getBasePath(user.userType)
  const ordersSlug = getOrdersSlug(user.userType)
  const discoverySlug = getDiscoverySlug(user.userType)

  const items = [
    { href: `${basePath}/dashboard`, icon: '🏠', label: 'Home' },
    { href: `${basePath}/${ordersSlug}`, icon: '📦', label: titleCase(ordersSlug) },
    {
      href: `${basePath}/${discoverySlug}`,
      icon: '🔍',
      label: SHORT_DISCOVERY[user.userType] ?? titleCase(discoverySlug),
    },
    { href: `${basePath}/enquiries`, icon: '📬', label: 'Enquiries' },
    { href: `${basePath}/profile`, icon: '👤', label: 'Profile' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-border-dark bg-card">
      {items.map((item) => {
        // Exact match, or a child route — but never let '/x/orders' light up
        // 'Home' at '/x/dashboard'. Prefix matching is scoped per item.
        const active =
          pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 text-[10px] font-medium ${
              active ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="truncate px-1">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
