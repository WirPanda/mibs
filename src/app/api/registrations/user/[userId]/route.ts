import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrations, courses } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Validate userId parameter
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');
    const includeCourseDetails = searchParams.get('includeCourseDetails') === 'true';

    // Build query
    let query = db
      .select()
      .from(registrations)
      .where(eq(registrations.userId, userId))
      .orderBy(desc(registrations.registeredAt));

    // Add status filter if provided
    if (status) {
      query = db
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.userId, userId),
            eq(registrations.status, status)
          )
        )
        .orderBy(desc(registrations.registeredAt));
    }

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // If includeCourseDetails is true, fetch course details for each registration
    if (includeCourseDetails && results.length > 0) {
      const enrichedResults = await Promise.all(
        results.map(async (registration) => {
          const course = await db
            .select()
            .from(courses)
            .where(eq(courses.id, registration.courseId))
            .limit(1);

          return {
            ...registration,
            courseDetails: course.length > 0 ? course[0] : null
          };
        })
      );

      return NextResponse.json(enrichedResults, { status: 200 });
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET registrations by userId error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}