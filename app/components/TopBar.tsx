"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "../context/UserContext";
import { getUnreadCount } from "../chat/data";

type Notification = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    icon: "🔔",
    title: "Jaipur Ethnic Works sent you an enquiry",
    detail:
      "They are looking for metal buttons 4-hole 15mm silver — 5,000 pieces",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: "n2",
    icon: "📦",
    title: "New sample brief matching your products",
    detail:
      "A brand is looking for trim suppliers in Delhi NCR for summer collection",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: "n3",
    icon: "✅",
    title: "Your verification application received",
    detail:
      "Bronze verification confirmed. Upgrade to Silver to unlock credit access.",
    time: "Yesterday",
    unread: false,
  },
];

const RECENT_SEARCHES = ["Cotton Lawn Surat", "Jaipur Ethnic Wear", "Metal Buttons"];

const CATEGORY_LINKS = [
  { label: "Manufacturers", href: "/manufacturers" },
  { label: "Fabric", href: "/fabprice" },
  { label: "Trims", href: "/fabprice" },
  { label: "FabTalent", href: "/fabmerch" },
];

const SEARCH_RESULTS = [
  {
    icon: "🏭",
    name: "Jaipur Ethnic Works",
    meta: "Manufacturer • Gold Verified • Ethnic Wear",
    href: "/manufacturers",
  },
  {
    icon: "🧷",
    name: "Delhi Trim House",
    meta: "Trim Supplier • Silver Verified",
    href: "/manufacturers",
  },
  {
    icon: "👔",
    name: "Meera Sharma",
    meta: "Verified Merchandiser • Delhi NCR",
    href: "/fabmerch",
  },
];

export default function TopBar({
  title,
  subtitle,
  rightContent,
  alertNotification,
}: {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  alertNotification?: { title: string; detail: string };
}) {
  const router = useRouter();
  const { user, mounted } = useUser();
  const chatUnread = mounted ? getUnreadCount(user.userType, Boolean(user.position)) : 0;

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredSearchResults = (() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return SEARCH_RESULTS;
    return SEARCH_RESULTS.filter(
      (result) =>
        result.name.toLowerCase().includes(query) ||
        result.meta.toLowerCase().includes(query)
    );
  })();

  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (!showSearch) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowSearch(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    searchInputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showSearch]);

  const markAllRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, unread: false })));
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <>
      {/*
        ⚠️ `min-h-16`, NOT `h-16`. MEASURED, not guessed: at a fixed 64px the
        greeting wraps to two lines at mobile width and the header clips its
        own title — 14px cut at 375px, 33px at 320px. It went unnoticed
        because this bar was only ever rendered inside a shell that was
        `display:none` under 768px. Now that the mobile view renders it, the
        height has to follow the content.
      */}
      <div
        className="sticky top-0 z-10 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border-dark px-4 py-3 md:px-6 md:py-0"
        style={{ backgroundColor: "#07122a" }}
      >
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold text-white md:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {rightContent}

          <button
            type="button"
            aria-label="Messages"
            onClick={() => router.push("/chat")}
            className="relative cursor-pointer text-lg text-text-primary"
          >
            💬
            {chatUnread > 0 && (
              <span
                className="absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                style={{ top: "-4px", right: "-4px" }}
              >
                {chatUnread}
              </span>
            )}
          </button>

          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative cursor-pointer text-lg text-text-primary"
            >
              🔔
              {unreadCount > 0 && (
                <span
                  className="absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                  style={{ top: "-4px", right: "-4px" }}
                >
                  {unreadCount}
                </span>
              )}
              {alertNotification && (
                <span
                  className="absolute h-2 w-2 rounded-full bg-amber-400"
                  style={{ bottom: "-2px", right: "-2px" }}
                />
              )}
            </button>

            {showNotifications && (
              <div
                /*
                  ⚠️ THE OVERFLOW WAS OFF THE LEFT EDGE, NOT THE RIGHT, and
                  clamping the width alone does NOT fix it. This panel is
                  right-anchored to the bell; once the 260px sidebar is gone
                  the bell sits near the viewport edge, so a 320px panel
                  hanging left of it runs off screen. Measured before the
                  fix: 26px cut at 375px, 41px at 360px, 81px at 320px, fine
                  only at 414px+. A width clamp still left 18px cut at 375px,
                  because at that size `min(320px, 100vw-32px)` is still
                  320px — the anchor was the problem, not the width.

                  So on mobile it is `fixed` with BOTH edges pinned to the
                  viewport (`inset-x-4`), which cannot overflow at any width.
                  Every `md:` class restores the original desktop geometry
                  exactly: absolute, 56px down, 16px in, 320px wide.

                  It never caused horizontal page scroll, so the symptom was
                  silently unreachable content rather than a visibly broken
                  page — which is why it survived this long.
                */
                className="hide-scrollbar fixed inset-x-4 top-20 z-[999] max-h-[70vh] overflow-y-auto rounded-xl border border-border-dark bg-card md:absolute md:inset-x-auto md:right-4 md:top-14 md:w-80"
                style={{
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                <div className="flex items-center justify-between border-b border-border-dark px-4 py-3">
                  <p className="text-[15px] font-bold text-white">
                    Notifications
                  </p>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[12px] font-semibold text-primary"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="flex flex-col">
                  {alertNotification && (
                    <div
                      className="relative border-b border-border-dark px-4 py-3"
                      style={{ borderLeft: "2px solid #f2ca50" }}
                    >
                      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-400" />
                      <div className="flex gap-2.5 pr-4">
                        <span className="shrink-0 text-base">⚠️</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-text-primary">
                            {alertNotification.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-text-secondary">
                            {alertNotification.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="relative border-b border-border-dark px-4 py-3 last:border-b-0"
                      style={
                        notification.unread
                          ? { borderLeft: "2px solid #63B3ED" }
                          : undefined
                      }
                    >
                      {notification.unread && (
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#63B3ED]" />
                      )}
                      <div className="flex gap-2.5 pr-4">
                        <span className="shrink-0 text-base">
                          {notification.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-text-primary">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-text-secondary">
                            {notification.detail}
                          </p>
                          <p className="mt-1 text-[11px] text-text-secondary">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                  <div className="px-4 py-3 text-center">
                    <Link
                      href="/enquiries"
                      className="text-[12px] font-semibold text-primary"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

          <button
            type="button"
            aria-label="Search"
            onClick={() => setShowSearch(true)}
            className="cursor-pointer text-lg text-text-primary"
          >
            🔍
          </button>
        </div>
      </div>

      {showSearch && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: "rgba(7,18,42,0.95)",
            padding: "80px 20px 20px",
            overflowY: "auto",
          }}
          onClick={closeSearch}
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={closeSearch}
            className="absolute right-6 top-6 text-2xl text-text-secondary transition-colors hover:text-text-primary"
          >
            ✕
          </button>

          <div
            className="mx-auto w-full max-w-[640px]"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search manufacturers, fabric, trims, orders..."
              className="w-full rounded-xl outline-none"
              style={{
                backgroundColor: "#0D1B33",
                border: "2px solid #f2ca50",
                padding: "16px 20px",
                fontSize: "18px",
                color: "#E2E8F0",
              }}
            />

            {!searchQuery.trim() ? (
              <>
                <p className="mt-6 text-xs text-text-secondary">
                  Recent searches:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RECENT_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setSearchQuery(term)}
                      className="rounded-[20px] border border-border-dark bg-card px-3 py-1.5 text-xs text-text-secondary"
                    >
                      {term}
                    </button>
                  ))}
                </div>

                <p className="mt-6 text-xs text-text-secondary">
                  Browse by category:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORY_LINKS.map((category) => (
                    <Link
                      key={category.label}
                      href={category.href}
                      onClick={closeSearch}
                      className="rounded-[20px] border border-border-dark bg-card px-3 py-1.5 text-xs text-text-secondary"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((result) => (
                    <Link
                      key={result.name}
                      href={result.href}
                      onClick={closeSearch}
                      className="rounded-[8px] border border-border-dark bg-background p-3 transition-colors hover:border-primary"
                    >
                      <p className="text-sm font-bold text-white">
                        {result.icon} {result.name}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {result.meta}
                      </p>
                      <span className="mt-1.5 inline-block text-xs font-semibold text-primary">
                        View Profile →
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="mt-2 text-sm text-text-secondary">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
