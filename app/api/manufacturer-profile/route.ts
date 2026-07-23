import { getUserByPhone, saveManufacturerProfile } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only (see app/onboarding/manufacturer/page.tsx) — resolves the
// real users.id from phone server-side, since the dev-mode "userId" kept in
// localStorage is a synthetic dev-user-<phone> string, not the actual UUID
// manufacturer_profiles.user_id needs to reference.
export async function POST(request: Request) {
  const {
    phone,
    businessName,
    city,
    state,
    categories,
    minOrder,
    capacity,
    unitType,
    specialisations,
  } = await request.json();

  if (!phone || !businessName) {
    return NextResponse.json(
      { error: "phone and businessName are required" },
      { status: 400 }
    );
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json(
      { error: "No user found for this phone number" },
      { status: 404 }
    );
  }

  try {
    const profile = await saveManufacturerProfile({
      user_id: user.id,
      business_name: businessName,
      city,
      state,
      categories: categories ?? [],
      min_order: Number(minOrder) || 0,
      capacity,
      unit_type: unitType,
      specialisations: specialisations ?? [],
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
