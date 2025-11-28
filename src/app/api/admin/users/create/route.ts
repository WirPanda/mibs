import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, account } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !["admin", "owner"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Admin access required", code: "ADMIN_ACCESS_REQUIRED" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters", code: "PASSWORD_TOO_SHORT" },
        { status: 400 }
      );
    }

    // Только владелец может создавать владельцев
    if (role === "owner" && currentUser.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can create owners", code: "INSUFFICIENT_PERMISSIONS" },
        { status: 403 }
      );
    }

    // Используем better-auth для создания пользователя с правильным хешированием пароля
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      }
    });

    if (!result || !result.user) {
      return NextResponse.json(
        { error: "Failed to create user", code: "CREATE_USER_FAILED" },
        { status: 500 }
      );
    }

    // Обновляем роль пользователя
    await db.update(user)
      .set({ role })
      .where(eq(user.id, result.user.id));

    return NextResponse.json({ 
      success: true, 
      user: { ...result.user, role } 
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "User already exists", code: "USER_ALREADY_EXISTS" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
