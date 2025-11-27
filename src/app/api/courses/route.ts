import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const course = await db
        .select()
        .from(courses)
        .where(eq(courses.id, parseInt(id)))
        .limit(1);

      if (course.length === 0) {
        return NextResponse.json(
          { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(course[0], { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isActiveParam = searchParams.get('isActive');

    let query = db.select().from(courses);

    // Build WHERE conditions
    const conditions = [];

    // Search across title, instructor, and category
    if (search) {
      conditions.push(
        or(
          like(courses.title, `%${search}%`),
          like(courses.instructor, `%${search}%`),
          like(courses.category, `%${search}%`)
        )
      );
    }

    // Filter by category
    if (category) {
      conditions.push(eq(courses.category, category));
    }

    // Filter by isActive status
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      conditions.push(eq(courses.isActive, isActive));
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering, pagination
    const results = await query
      .orderBy(desc(courses.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      duration,
      price,
      instructor,
      category,
      maxStudents,
      startDate,
      imageUrl,
      learningMaterials,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (!duration) {
      return NextResponse.json(
        { error: 'Duration is required', code: 'MISSING_DURATION' },
        { status: 400 }
      );
    }

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor is required', code: 'MISSING_INSTRUCTOR' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    if (maxStudents === undefined || maxStudents === null) {
      return NextResponse.json(
        { error: 'Max students is required', code: 'MISSING_MAX_STUDENTS' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required', code: 'MISSING_START_DATE' },
        { status: 400 }
      );
    }

    // Validate field values
    if (typeof maxStudents !== 'number' || maxStudents <= 0) {
      return NextResponse.json(
        {
          error: 'Max students must be greater than 0',
          code: 'INVALID_MAX_STUDENTS',
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      title: title.trim(),
      description: description.trim(),
      duration: duration.trim(),
      price: price !== undefined ? parseInt(price) : 0,
      instructor: instructor.trim(),
      category: category.trim(),
      maxStudents: parseInt(maxStudents),
      startDate: new Date(startDate),
      imageUrl: imageUrl?.trim() || null,
      learningMaterials: learningMaterials?.trim() || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newCourse = await db
      .insert(courses)
      .values(sanitizedData)
      .returning();

    return NextResponse.json(newCourse[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.id, parseInt(id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    // Process optional fields for update
    if (body.title !== undefined) {
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description.trim();
    }

    if (body.duration !== undefined) {
      updates.duration = body.duration.trim();
    }

    if (body.price !== undefined) {
      const price = parseInt(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'Price must be greater than or equal to 0', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
      updates.price = price;
    }

    if (body.instructor !== undefined) {
      updates.instructor = body.instructor.trim();
    }

    if (body.category !== undefined) {
      updates.category = body.category.trim();
    }

    if (body.maxStudents !== undefined) {
      const maxStudents = parseInt(body.maxStudents);
      if (isNaN(maxStudents) || maxStudents <= 0) {
        return NextResponse.json(
          {
            error: 'Max students must be greater than 0',
            code: 'INVALID_MAX_STUDENTS',
          },
          { status: 400 }
        );
      }
      updates.maxStudents = maxStudents;
    }

    if (body.startDate !== undefined) {
      updates.startDate = new Date(body.startDate);
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (body.imageUrl !== undefined) {
      updates.imageUrl = body.imageUrl ? body.imageUrl.trim() : null;
    }

    if (body.learningMaterials !== undefined) {
      updates.learningMaterials = body.learningMaterials ? body.learningMaterials.trim() : null;
    }

    // Always update updatedAt
    updates.updatedAt = new Date();

    const updatedCourse = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedCourse[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.id, parseInt(id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(courses)
      .where(eq(courses.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Course deleted successfully',
        course: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}