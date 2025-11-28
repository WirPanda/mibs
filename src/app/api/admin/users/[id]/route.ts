import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, account } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !["admin", "moderator", "owner"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Admin access required", code: "ADMIN_ACCESS_REQUIRED" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Список разрешенных полей для обновления
    const allowedFields = [
      "name", "emailVerified", "image", "role", "phone", 
      "work_email", "personal_email", "full_name", "age", 
      "organization", "position", "experience", "second_specialty", 
      "comments", "gender"
    ];

    // Фильтруем только разрешенные поля
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Проверка прав для изменения роли
    if (updates.role) {
      // Только владелец может назначать роль владельца
      if (updates.role === "owner" && currentUser.role !== "owner") {
        return NextResponse.json(
          { error: "Only owners can assign owner role", code: "INSUFFICIENT_PERMISSIONS" },
          { status: 403 }
        );
      }
      
      // Модератор не может менять роли
      if (currentUser.role === "moderator") {
        return NextResponse.json(
          { error: "Moderators cannot change roles", code: "INSUFFICIENT_PERMISSIONS" },
          { status: 403 }
        );
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(user).set(updates).where(eq(user.id, id));
    }

    // Обработка смены пароля (только для владельца)
    if (body.password && currentUser.role === "owner") {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      await db.update(account)
        .set({ password: hashedPassword })
        .where(eq(account.userId, id));
    }

    const updatedUser = await db.select().from(user).where(eq(user.id, id)).limit(1);

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
