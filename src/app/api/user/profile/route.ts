import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Валидируем токен через better-auth
    const session = await auth.api.getSession({
      headers: new Headers({
        authorization: `Bearer ${token}`
      })
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Invalid token", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    const userProfile = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(userProfile[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Валидируем токен через better-auth
    const session = await auth.api.getSession({
      headers: new Headers({
        authorization: `Bearer ${token}`
      })
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Invalid token", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Валидация gender
    if (body.gender && !['male', 'female'].includes(body.gender)) {
      return NextResponse.json(
        { error: 'Invalid gender value', code: 'INVALID_GENDER' },
        { status: 400 }
      );
    }

    // Список полей, которые пользователь может обновлять
    const allowedFields = [
      "phone", "personal_email", "organization", "position", 
      "experience", "second_specialty", "age", "gender", "image"
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(user).set(updates).where(eq(user.id, session.user.id));
    }

    const updatedUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}