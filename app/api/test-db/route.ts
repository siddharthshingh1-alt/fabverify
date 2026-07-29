import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/app/lib/db";
import { dbErrorResponse } from "@/app/lib/apiError";

export async function GET() {
  try {
    await checkDatabaseConnection();

    return NextResponse.json({
      success: true,
      message: "Database connected!",
    });
  } catch (error) {
    // 503 unreachable / 500 genuine query fault, never raw exception text.
    // Replaces a local copy of getErrorMessage() that always answered 500.
    return dbErrorResponse(error);
  }
}
