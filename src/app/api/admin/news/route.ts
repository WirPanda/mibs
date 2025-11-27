import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { news, user } from '@/db/schema';
import { eq, like, or, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - Get all news (admin only)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isPublished = searchParams.get('isPublished');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select({
      news: news,
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })
    .from(news)
    .leftJoin(user, eq(news.authorId, user.id));

    // Build conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(news.title, `%${search}%`),
          like(news.excerpt, `%${search}%`),
          like(news.content, `%${search}%`)
        )
      );
    }

    if (isPublished !== null) {
      const isPublishedValue = isPublished === 'true' ? 1 : 0;
      conditions.push(eq(news.isPublished, isPublishedValue));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(or(...conditions));
    }

    const results = await query
      .orderBy(desc(news.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// PATCH - Update news (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid news ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const updates: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ 
          error: 'Title cannot be empty',
          code: 'INVALID_TITLE' 
        }, { status: 400 });
      }
      updates.title = body.title.trim();
    }

    if (body.content !== undefined) {
      if (!body.content.trim()) {
        return NextResponse.json({ 
          error: 'Content cannot be empty',
          code: 'INVALID_CONTENT' 
        }, { status: 400 });
      }
      updates.content = body.content.trim();
    }

    if (body.excerpt !== undefined) {
      if (!body.excerpt.trim()) {
        return NextResponse.json({ 
          error: 'Excerpt cannot be empty',
          code: 'INVALID_EXCERPT' 
        }, { status: 400 });
      }
      updates.excerpt = body.excerpt.trim();
    }

    if (body.imageUrl !== undefined) {
      updates.imageUrl = body.imageUrl ? body.imageUrl.trim() : null;
    }

    if (body.isPublished !== undefined) {
      const isPublishedValue = body.isPublished === true ? 1 : 0;
      updates.isPublished = isPublishedValue;

      if (isPublishedValue === 1) {
        updates.publishedAt = new Date();
      }
    }

    const updated = await db.update(news)
      .set(updates)
      .where(eq(news.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'News article not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// DELETE - Delete news (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid news ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const deleted = await db.delete(news)
      .where(eq(news.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'News article not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'News article deleted successfully',
      news: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
