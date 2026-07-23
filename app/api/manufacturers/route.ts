import { getManufacturers } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const manufacturers = await getManufacturers({
    city: searchParams.get("city") ?? undefined,
    tier: searchParams.get("tier") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });

  return NextResponse.json({ manufacturers });
}
