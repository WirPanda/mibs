import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    const courseId = parseInt(id);

    // Query courses table by ID
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    // If course not found, return 404
    if (course.length === 0) {
      return NextResponse.json(
        { 
          error: "Course not found",
          code: "COURSE_NOT_FOUND" 
        },
        { status: 404 }
      );
    }

    const courseData = course[0];

    // If learningMaterials is null or empty, return 404
    if (!courseData.learningMaterials || courseData.learningMaterials.trim() === '') {
      return NextResponse.json(
        { 
          error: "Learning materials not available for this course",
          code: "NO_MATERIALS" 
        },
        { status: 404 }
      );
    }

    // Parse learningMaterials (if it's a JSON string, parse it; otherwise return as-is)
    let materials;
    try {
      materials = JSON.parse(courseData.learningMaterials);
    } catch (parseError) {
      // If parsing fails, return as-is (it's likely a plain string)
      materials = courseData.learningMaterials;
    }

    // Return parsed materials with 200 status
    return NextResponse.json(materials, { status: 200 });

  } catch (error) {
    console.error('GET learning materials error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}