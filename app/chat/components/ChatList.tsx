"use client";

import { useState } from "react";
import type { Conversation } from "../types";
import { PILL_CLASSES } from "../types";

export default function ChatList({
  conversations,
  onSelect,
}: {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="hide-scrollbar h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background px-4 py-2">
        <div className="relative flex h-11 items-center rounded-[22px] bg-card px-3">
          <span className="text-sm text-text-secondary">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="ml-2 h-full w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] italic text-text-secondary">
          No conversations found.
        </p>
      ) : (
        filtered.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className="flex h-[68px] w-full items-center gap-3 border-b border-border-dark px-4 py-3 text-left active:bg-primary/[0.08]"
          >
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
                {conversation.initials}
              </div>
              {conversation.unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {conversation.unread}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-text-primary">{conversation.name}</p>
                <span className="shrink-0 text-[11px] text-text-secondary">{conversation.time}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-text-secondary">{conversation.lastMessage}</p>
                {conversation.statusPill && (
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${PILL_CLASSES[conversation.statusPill.color]}`}
                  >
                    {conversation.statusPill.label}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
