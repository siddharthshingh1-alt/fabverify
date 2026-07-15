"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
}: {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}) {
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
      <div
        className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border-dark px-6"
        style={{ backgroundColor: "#07122a" }}
      >
        <div>
          <h1 className="font-display text-xl font-bold text-white">
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
            </button>

            {showNotifications && (
              <div
                className="hide-scrollbar overflow-y-auto rounded-xl border border-border-dark bg-card"
                style={{
                  position: "absolute",
                  top: "56px",
                  right: "16px",
                  width: "320px",
                  maxHeight: "70vh",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  zIndex: 999,
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
