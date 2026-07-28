import { saveManufacturerProfile } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Saves the caller's OWN manufacturer profile.
//
// The users.id written to manufacturer_profiles.user_id now comes from the
// VERIFIED session rather than from a phone lookup on the request body, so
// this route cannot be aimed at another account. It previously accepted any
// phone number, letting anyone overwrite another manufacturer's business
// profile. (The dev-mode "userId" in localStorage is a synthetic
// dev-user-<phone> string, not the real UUID, which is why the id is still
// resolved server-side.)
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

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  const user = caller.user;

  if (normalisePhone(user.phone) !== normalisePhone(phone)) {
    return NextResponse.json(
      { error: "Not authorised for this account" },
      { status: 403 }
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
    return dbErrorResponse(error);
  }
}
