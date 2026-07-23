// Shape returned by GET /api/sample-briefs and /api/sample-briefs/[id] — a
// sample_briefs row joined with the posting buyer.
export type SampleBriefRow = {
  id: string;
  buyer_id: string;
  title: string;
  category: string | null;
  description: string | null;
  quantity: number | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
  buyer?: {
    id: string;
    name: string | null;
    city: string | null;
    user_type?: string | null;
    phone?: string;
  } | null;
};
