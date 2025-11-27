import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // Защита админ панели - требуется роль admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login?redirect=/admin", request.url));
    }
    
    // Получаем роль пользователя из базы данных
    const [userData] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    
    if (!userData || userData.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // Защита личного кабинета - требуется аутентификация
  if (request.nextUrl.pathname === "/account") {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login?redirect=/account", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account"],
};