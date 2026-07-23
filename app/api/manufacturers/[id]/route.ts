import { getManufacturerById } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const manufacturer = await getManufacturerById(id);

  if (!manufacturer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ manufacturer });
}
