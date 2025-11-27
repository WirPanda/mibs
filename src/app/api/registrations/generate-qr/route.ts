import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { registrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { registrationId, fullName, courseTitle, registrationDate } = body;

    // Validate required fields
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required', code: 'MISSING_REGISTRATION_ID' },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required', code: 'MISSING_FULL_NAME' },
        { status: 400 }
      );
    }

    if (!courseTitle) {
      return NextResponse.json(
        { error: 'Course title is required', code: 'MISSING_COURSE_TITLE' },
        { status: 400 }
      );
    }

    if (!registrationDate) {
      return NextResponse.json(
        { error: 'Registration date is required', code: 'MISSING_REGISTRATION_DATE' },
        { status: 400 }
      );
    }

    // Validate registrationId is a valid integer
    const parsedRegistrationId = parseInt(registrationId);
    if (isNaN(parsedRegistrationId)) {
      return NextResponse.json(
        { error: 'Registration ID must be a valid integer', code: 'INVALID_REGISTRATION_ID' },
        { status: 400 }
      );
    }

    // Check if registration exists and belongs to authenticated user
    const existingRegistration = await db
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.id, parsedRegistrationId),
          eq(registrations.userId, user.id)
        )
      )
      .limit(1);

    if (existingRegistration.length === 0) {
      return NextResponse.json(
        { error: 'Registration not found', code: 'REGISTRATION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Generate QR code data as JSON string
    const qrCodeData = JSON.stringify({
      registrationId: parsedRegistrationId,
      fullName: fullName.trim(),
      courseTitle: courseTitle.trim(),
      registrationDate,
      generatedAt: new Date().toISOString()
    });

    // Update registration with QR code data
    const updatedRegistration = await db
      .update(registrations)
      .set({
        qrCode: qrCodeData,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(registrations.id, parsedRegistrationId),
          eq(registrations.userId, user.id)
        )
      )
      .returning();

    if (updatedRegistration.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update registration', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedRegistration[0], { status: 200 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}