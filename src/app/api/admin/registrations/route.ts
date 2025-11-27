import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrations, courses, user } from '@/db/schema';
import { eq, like, or, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - Get all registrations (admin only)
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
    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select({
      registration: registrations,
      course: {
        id: courses.id,
        title: courses.title,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })
    .from(registrations)
    .leftJoin(courses, eq(registrations.courseId, courses.id))
    .leftJoin(user, eq(registrations.userId, user.id));

    // Build conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(registrations.firstName, `%${search}%`),
          like(registrations.lastName, `%${search}%`),
          like(registrations.email, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(registrations.status, status));
    }

    if (courseId && !isNaN(parseInt(courseId))) {
      conditions.push(eq(registrations.courseId, parseInt(courseId)));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(or(...conditions));
    }

    const results = await query
      .orderBy(desc(registrations.registeredAt))
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

// PATCH - Update registration status (admin only)
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
        error: 'Valid registration ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      updates.status = body.status;
      
      if (body.status === 'confirmed') {
        updates.confirmedAt = new Date();
      }
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATE_FIELDS' 
      }, { status: 400 });
    }

    const updated = await db.update(registrations)
      .set(updates)
      .where(eq(registrations.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Registration not found',
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

// DELETE - Delete registration (admin only)
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
        error: 'Valid registration ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const deleted = await db.delete(registrations)
      .where(eq(registrations.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Registration not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Registration deleted successfully',
      registration: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
