// Client-only "backend" for the bulk order placement feature. There is no
// server in this demo app — the buyer's wizard writes an order here, and the
// manufacturer dashboard/orders screens read it back, so a placed order is
// visible across role views in the same browser via localStorage.

export type BulkOrderMilestone = {
  name: string
  percent: number
  amount: number
}

export type BulkOrderDocument = {
  key: string
  label: string
  uploaded: boolean
}

export type BulkOrderStatus = 'pending_acceptance' | 'active' | 'declined'

export type BulkOrder = {
  id: string
  manufacturerId: string
  manufacturerName: string
  brandName: string
  styleName: string
  styleNumber: string
  category: string
  season: string
  orderType: string
  totalQuantity: number
  sizeRatio: Record<string, number>
  colours: { name: string; quantity: number }[]
  pricePerPiece: number
  totalValue: number
  deliveryDate: string
  deliveryCity: string
  deliveryState: string
  paymentMilestones: BulkOrderMilestone[]
  documents: BulkOrderDocument[]
  qualityLevel: string
  aqlLevel: string
  confidential: boolean
  createdAt: string
  status: BulkOrderStatus
}

const STORAGE_KEY = 'fabverify_bulk_orders'

function readAll(): BulkOrder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BulkOrder[]) : []
  } catch {
    return []
  }
}

function writeAll(orders: BulkOrder[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // ignore quota / serialization errors — this is demo-only persistence
  }
}

export function getBulkOrders(): BulkOrder[] {
  return readAll()
}

export function getBulkOrdersForManufacturer(manufacturerId: string): BulkOrder[] {
  return readAll().filter((order) => order.manufacturerId === manufacturerId)
}

export function getBulkOrderById(id: string): BulkOrder | undefined {
  return readAll().find((order) => order.id === id)
}

export function generateBulkOrderId(): string {
  const year = new Date().getFullYear()
  const existing = readAll().filter((order) => order.id.startsWith(`ORD-${year}-`))
  const nextSeq = existing.length + 1
  return `ORD-${year}-${String(nextSeq).padStart(3, '0')}`
}

export function createBulkOrder(order: BulkOrder) {
  const all = readAll()
  all.unshift(order)
  writeAll(all)
}

export function acceptBulkOrder(id: string) {
  writeAll(readAll().map((order) => (order.id === id ? { ...order, status: 'active' as const } : order)))
}

export function declineBulkOrder(id: string) {
  writeAll(readAll().map((order) => (order.id === id ? { ...order, status: 'declined' as const } : order)))
}
