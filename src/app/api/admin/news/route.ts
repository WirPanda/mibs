import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { news, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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

    const allNews = await db
      .select({
        id: news.id,
        title: news.title,
        content: news.content,
        excerpt: news.excerpt,
        authorId: news.authorId,
        authorName: user.name,
        imageUrl: news.imageUrl,
        isPublished: news.isPublished,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .leftJoin(user, eq(news.authorId, user.id))
      .orderBy(desc(news.createdAt))
      .limit(limit);

    return NextResponse.json(allNews);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
