import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { news } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(news)
        .where(and(
          eq(news.id, parseInt(id)),
          eq(news.authorId, user.id)
        ))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'News article not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isPublishedParam = searchParams.get('isPublished');
    const authorIdParam = searchParams.get('authorId');

    let conditions = [eq(news.authorId, user.id)];

    // Search across title, excerpt, and content
    if (search) {
      conditions.push(
        or(
          like(news.title, `%${search}%`),
          like(news.excerpt, `%${search}%`),
          like(news.content, `%${search}%`)
        )!
      );
    }

    // Filter by isPublished
    if (isPublishedParam !== null) {
      const isPublished = isPublishedParam === 'true';
      conditions.push(eq(news.isPublished, isPublished ? 1 : 0));
    }

    // Filter by authorId
    if (authorIdParam) {
      conditions.push(eq(news.authorId, authorIdParam));
    }

    const results = await db.select()
      .from(news)
      .where(and(...conditions))
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId or authorId provided in body
    if ('userId' in body || 'user_id' in body || 'authorId' in body || 'author_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    const { title, content, excerpt, imageUrl, isPublished } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json({ 
        error: 'Title is required',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'Content is required',
        code: 'MISSING_CONTENT' 
      }, { status: 400 });
    }

    if (!excerpt || !excerpt.trim()) {
      return NextResponse.json({ 
        error: 'Excerpt is required',
        code: 'MISSING_EXCERPT' 
      }, { status: 400 });
    }

    const now = new Date();
    const currentTimestamp = now;

    // Prepare insert data
    const insertData: any = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      authorId: user.id,
      isPublished: isPublished === true ? 1 : 0,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    // Add optional imageUrl
    if (imageUrl && imageUrl.trim()) {
      insertData.imageUrl = imageUrl.trim();
    }

    // Set publishedAt if isPublished is true
    if (isPublished === true) {
      insertData.publishedAt = currentTimestamp;
    }

    const newRecord = await db.insert(news)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();

    // Security check: reject if userId or authorId provided in body
    if ('userId' in body || 'user_id' in body || 'authorId' in body || 'author_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existing = await db.select()
      .from(news)
      .where(and(
        eq(news.id, parseInt(id)),
        eq(news.authorId, user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'News article not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    // Update allowed fields
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

      // Set publishedAt if changing to published and publishedAt is null
      if (isPublishedValue === 1 && !existing[0].publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    const updated = await db.update(news)
      .set(updates)
      .where(and(
        eq(news.id, parseInt(id)),
        eq(news.authorId, user.id)
      ))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existing = await db.select()
      .from(news)
      .where(and(
        eq(news.id, parseInt(id)),
        eq(news.authorId, user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'News article not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(news)
      .where(and(
        eq(news.id, parseInt(id)),
        eq(news.authorId, user.id)
      ))
      .returning();

    return NextResponse.json({ 
      message: 'News article deleted successfully',
      data: deleted[0] 
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}