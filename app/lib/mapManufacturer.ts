import type { Manufacturer, Tier } from "../data/manufacturers";

// Shape returned by GET /api/manufacturers and /api/manufacturers/[id] —
// a manufacturer_profiles row joined with its owning user.
export type ManufacturerRow = {
  id: string;
  business_name: string;
  city: string | null;
  state: string | null;
  categories: string[] | null;
  min_order: number | null;
  capacity: string | null;
  verification_tier: string | null;
  fab_score: number | null;
  unit_type: string | null;
  moq_unit: string | null;
  specialisations: string[] | null;
  about: string | null;
  notable_clients: string[] | null;
  user?: { id: string; name: string | null; phone: string; city: string | null; state: string | null } | null;
};

const VALID_TIERS: Tier[] = ["gold", "silver", "bronze"];

// Maps a real manufacturer_profiles row onto the same Manufacturer shape the
// UI already renders (previously backed by mock data in data/manufacturers.ts).
// Real manufacturers don't have review/order-stat aggregation built yet, so
// those fields default to 0/empty rather than being fabricated.
export function mapManufacturerRow(row: ManufacturerRow): Manufacturer {
  const tier = VALID_TIERS.includes(row.verification_tier as Tier)
    ? (row.verification_tier as Tier)
    : "bronze";

  return {
    id: row.id,
    name: row.business_name,
    city: row.city ?? "",
    state: row.state ?? "",
    tier,
    tags: row.categories ?? [],
    rating: 0,
    fabScore: row.fab_score ?? 0,
    orders: 0,
    delivery: 0,
    moq: row.min_order ?? 0,
    moqUnit: row.moq_unit ?? "pieces",
    experience: 0,
    capacity: 0,
    leadTime: "",
    samplingTime: "",
    fabric: [],
    techniques: row.specialisations ?? [],
    clients: row.notable_clients ?? [],
    export: false,
    about: row.about ?? "",
  };
}
