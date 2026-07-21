"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useUser } from "@/app/context/UserContext";
import { getBasePath } from "@/app/lib/routing";
import { ChatTabProvider, useChatTab, type ChatTab } from "../context";

const TABS: { id: ChatTab; icon: string; label: string }[] = [
  { id: "chats", icon: "💬", label: "Chats" },
  { id: "orders", icon: "📦", label: "Orders" },
  { id: "scan", icon: "📷", label: "Scan QR" },
];

function TopBar() {
  const router = useRouter();
  const { user, userLabel, mounted } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const dashboardHref = user.userType === "buyer" && user.position
    ? "/enterprise/dashboard"
    : `${getBasePath(user.userType)}/dashboard`;

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border-dark bg-card px-4">
      <span className="font-display text-base font-bold text-primary">🧵 FabVerify</span>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-label={mounted ? `Account menu for ${user.name}` : "Account menu"}
          title={mounted ? user.name : undefined}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
        >
          {mounted && user.name ? user.name.charAt(0).toUpperCase() : "U"}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-30 w-52 rounded-[10px] border border-border-dark bg-card py-2 shadow-lg">
            <div className="px-3.5 py-1.5">
              <p className="truncate text-[13px] font-bold text-text-primary">
                {mounted ? user.name : "..."}
              </p>
              <p className="text-[11px] text-text-secondary">{mounted ? userLabel : ""}</p>
            </div>
            <div className="my-2 h-px bg-border-dark" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push(dashboardHref);
              }}
              className="block w-full px-3.5 py-2 text-left text-[13px] text-text-secondary"
            >
              Go to Dashboard →
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full px-3.5 py-2 text-left text-[13px] text-red-400"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BottomTabBar() {
  const { activeTab, setActiveTab, clearOpenConversation } = useChatTab();

  const handleClick = (tab: ChatTab) => {
    if (tab === "chats") clearOpenConversation();
    setActiveTab(tab);
  };

  return (
    <div className="flex h-[56px] shrink-0 border-t border-border-dark bg-card">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleClick(tab.id)}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 p-2"
          >
            <span className="text-lg">{tab.icon}</span>
            <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-text-secondary"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function ChatShell({ children }: { children: ReactNode }) {
  return (
    <ChatTabProvider>
      <div className="fixed left-1/2 top-0 bottom-0 flex w-full max-w-[480px] -translate-x-1/2 flex-col bg-background">
        <TopBar />
        <div className="hide-scrollbar min-h-0 flex-1 overflow-hidden">{children}</div>
        <BottomTabBar />
      </div>
    </ChatTabProvider>
  );
}
