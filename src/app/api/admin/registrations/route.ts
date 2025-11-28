import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !["admin", "moderator", "owner"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Admin access required", code: "ADMIN_ACCESS_REQUIRED" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const allRegistrations = await db
      .select()
      .from(registrations)
      .orderBy(desc(registrations.registeredAt))
      .limit(limit);

    return NextResponse.json(allRegistrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
