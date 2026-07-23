// Shape returned by GET /api/orders and /api/orders/[id] — an orders row
// joined with buyer, manufacturer, and its milestones.
export type OrderMilestoneRow = {
  id: string;
  order_id: string;
  milestone_number: number;
  milestone_name: string;
  payment_percentage: number;
  status: string;
  completed_at: string | null;
};

export type OrderRow = {
  id: string;
  order_number: string;
  buyer_id: string;
  manufacturer_id: string;
  style_name: string;
  quantity: number;
  price_per_piece: number;
  total_value: number;
  status: string;
  delivery_date: string;
  escrow_total: number;
  escrow_released: number;
  created_at: string;
  updated_at?: string;
  buyer?: { id: string; name: string | null; city: string | null; phone?: string } | null;
  manufacturer?: { id: string; name: string | null; city: string | null; phone?: string } | null;
  milestones?: OrderMilestoneRow[];
};

export type PendingOrderMilestone = { name: string; percent: number; amount: number };

// Shape PendingBulkOrderCard / AcceptOrderModal (app/components/pages/OrdersPage.tsx)
// and the manufacturer dashboard's pending-order notification cards expect —
// same fields the old localStorage-only BulkOrder type had, minus the ones
// with no real backing (documents are never persisted, so always empty).
export type PendingOrder = {
  id: string;
  orderNumber: string;
  styleName: string;
  totalQuantity: number;
  brandName: string;
  totalValue: number;
  deliveryDate: string;
  documents: { key: string; label: string; uploaded: boolean }[];
  paymentMilestones: PendingOrderMilestone[];
};

export function mapOrderRowToPendingOrder(row: OrderRow): PendingOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    styleName: row.style_name,
    totalQuantity: row.quantity,
    brandName: row.buyer?.name ?? "Unknown buyer",
    totalValue: row.total_value,
    deliveryDate: row.delivery_date,
    documents: [],
    paymentMilestones: (row.milestones ?? [])
      .slice()
      .sort((a, b) => a.milestone_number - b.milestone_number)
      .map((m) => ({
        name: m.milestone_name,
        percent: m.payment_percentage,
        amount: Math.round((row.total_value * m.payment_percentage) / 100),
      })),
  };
}
