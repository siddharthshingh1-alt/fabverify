"use client";

import type { OrderCard } from "../types";
import { PILL_CLASSES } from "../types";
import { useChatTab } from "../context";

export default function OrdersTab({
  orders,
  ordersBasePath,
}: {
  orders: OrderCard[];
  ordersBasePath: string;
}) {
  const { openConversation } = useChatTab();

  if (orders.length === 0) {
    return (
      <div className="hide-scrollbar h-full overflow-y-auto px-4 py-10">
        <p className="text-center text-[13px] italic text-text-secondary">
          No active orders yet.
        </p>
      </div>
    );
  }

  return (
    <div className="hide-scrollbar h-full overflow-y-auto py-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="mx-3 mb-2 rounded-[10px] bg-card p-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-text-primary">{order.style}</p>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${PILL_CLASSES[order.statusPill.color]}`}
            >
              {order.statusPill.label}
            </span>
          </div>

          <p className="mt-1 text-xs text-text-secondary">{order.counterparty}</p>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border-dark">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, order.progress))}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">
              {order.stageLabel} · {order.progress}%
            </span>
            <span className="text-[10px] text-text-secondary">{order.dueLabel}</span>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => openConversation(order.conversationId)}
              className="text-xs font-semibold text-text-secondary"
            >
              💬 Chat →
            </button>
            <a
              href={`${ordersBasePath}/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary"
            >
              📦 View Order →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
