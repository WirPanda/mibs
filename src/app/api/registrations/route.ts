import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrations, courses } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (basic international format)
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

// Valid status values
const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const registration = await db.select()
        .from(registrations)
        .where(and(
          eq(registrations.id, parseInt(id)),
          eq(registrations.userId, user.id)
        ))
        .limit(1);

      if (registration.length === 0) {
        return NextResponse.json({ 
          error: 'Registration not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(registration[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    let query = db.select().from(registrations);

    // Build WHERE conditions
    const conditions = [eq(registrations.userId, user.id)];

    // Search across firstName, lastName, email
    if (search) {
      conditions.push(
        or(
          like(registrations.firstName, `%${search}%`),
          like(registrations.lastName, `%${search}%`),
          like(registrations.email, `%${search}%`)
        )!
      );
    }

    // Filter by status
    if (status) {
      conditions.push(eq(registrations.status, status));
    }

    // Filter by courseId
    if (courseId && !isNaN(parseInt(courseId))) {
      conditions.push(eq(registrations.courseId, parseInt(courseId)));
    }

    // Filter by userId (only if matches authenticated user)
    if (userId && userId === user.id) {
      conditions.push(eq(registrations.userId, userId));
    }

    query = query.where(and(...conditions));
    
    // Apply ordering, pagination
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { courseId, firstName, lastName, email, phone, qrCode, notes } = body;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json({ 
        error: "Course ID is required",
        code: "MISSING_COURSE_ID" 
      }, { status: 400 });
    }

    if (!firstName || !firstName.trim()) {
      return NextResponse.json({ 
        error: "First name is required",
        code: "MISSING_FIRST_NAME" 
      }, { status: 400 });
    }

    if (!lastName || !lastName.trim()) {
      return NextResponse.json({ 
        error: "Last name is required",
        code: "MISSING_LAST_NAME" 
      }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ 
        error: "Phone is required",
        code: "MISSING_PHONE" 
      }, { status: 400 });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    // Validate phone format
    if (!PHONE_REGEX.test(phone.trim())) {
      return NextResponse.json({ 
        error: "Invalid phone format",
        code: "INVALID_PHONE" 
      }, { status: 400 });
    }

    // Validate courseId is valid integer
    if (isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Invalid course ID",
        code: "INVALID_COURSE_ID" 
      }, { status: 400 });
    }

    // Verify course exists
    const course = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ 
        error: "Course not found",
        code: "COURSE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Create registration
    const newRegistration = await db.insert(registrations)
      .values({
        userId: user.id,
        courseId: parseInt(courseId),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status: 'pending',
        qrCode: qrCode?.trim() || null,
        notes: notes?.trim() || null,
        registeredAt: new Date(),
        registrationDate: new Date(),
        confirmedAt: null
      })
      .returning();

    return NextResponse.json(newRegistration[0], { status: 201 });

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    // Security check: reject if userId or courseId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be modified",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    if ('courseId' in body || 'course_id' in body) {
      return NextResponse.json({ 
        error: "Course ID cannot be modified",
        code: "COURSE_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if registration exists and belongs to user
    const existing = await db.select()
      .from(registrations)
      .where(and(
        eq(registrations.id, parseInt(id)),
        eq(registrations.userId, user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Registration not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    // Handle firstName
    if ('firstName' in body) {
      if (!body.firstName || !body.firstName.trim()) {
        return NextResponse.json({ 
          error: "First name cannot be empty",
          code: "INVALID_FIRST_NAME" 
        }, { status: 400 });
      }
      updates.firstName = body.firstName.trim();
    }

    // Handle lastName
    if ('lastName' in body) {
      if (!body.lastName || !body.lastName.trim()) {
        return NextResponse.json({ 
          error: "Last name cannot be empty",
          code: "INVALID_LAST_NAME" 
        }, { status: 400 });
      }
      updates.lastName = body.lastName.trim();
    }

    // Handle email
    if ('email' in body) {
      if (!body.email || !body.email.trim()) {
        return NextResponse.json({ 
          error: "Email cannot be empty",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }
      if (!EMAIL_REGEX.test(body.email.trim())) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }
      updates.email = body.email.trim().toLowerCase();
    }

    // Handle phone
    if ('phone' in body) {
      if (!body.phone || !body.phone.trim()) {
        return NextResponse.json({ 
          error: "Phone cannot be empty",
          code: "INVALID_PHONE" 
        }, { status: 400 });
      }
      if (!PHONE_REGEX.test(body.phone.trim())) {
        return NextResponse.json({ 
          error: "Invalid phone format",
          code: "INVALID_PHONE" 
        }, { status: 400 });
      }
      updates.phone = body.phone.trim();
    }

    // Handle status
    if ('status' in body) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = body.status;
      
      // If status is changing to "confirmed", set confirmedAt
      if (body.status === 'confirmed' && existing[0].status !== 'confirmed') {
        updates.confirmedAt = new Date();
      }
    }

    // Handle optional fields
    if ('qrCode' in body) {
      updates.qrCode = body.qrCode?.trim() || null;
    }

    if ('notes' in body) {
      updates.notes = body.notes?.trim() || null;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existing[0], { status: 200 });
    }

    // Perform update
    const updated = await db.update(registrations)
      .set(updates)
      .where(and(
        eq(registrations.id, parseInt(id)),
        eq(registrations.userId, user.id)
      ))
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if registration exists and belongs to user
    const existing = await db.select()
      .from(registrations)
      .where(and(
        eq(registrations.id, parseInt(id)),
        eq(registrations.userId, user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Registration not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Perform deletion
    const deleted = await db.delete(registrations)
      .where(and(
        eq(registrations.id, parseInt(id)),
        eq(registrations.userId, user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Registration not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Registration deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}