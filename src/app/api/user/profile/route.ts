import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UpdateProfilePayload {
  phone?: string;
  personalEmail?: string;
  organization?: string;
  position?: string;
  experience?: string;
  secondSpecialty?: string | null;
  role?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticatedUser = await getCurrentUser(request);
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const updates: Partial<UpdateProfilePayload> = {};

    // Validate and process phone
    if ('phone' in body) {
      const phone = body.phone?.trim();
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone cannot be empty', code: 'EMPTY_FIELD' },
          { status: 400 }
        );
      }
      updates.phone = phone;
    }

    // Validate and process personalEmail
    if ('personalEmail' in body) {
      const personalEmail = body.personalEmail?.trim().toLowerCase();
      if (!personalEmail) {
        return NextResponse.json(
          { error: 'Personal email cannot be empty', code: 'EMPTY_FIELD' },
          { status: 400 }
        );
      }
      if (!EMAIL_REGEX.test(personalEmail)) {
        return NextResponse.json(
          { error: 'Invalid personal email format', code: 'INVALID_PERSONAL_EMAIL' },
          { status: 400 }
        );
      }
      updates.personalEmail = personalEmail;
    }

    // Validate and process organization
    if ('organization' in body) {
      const organization = body.organization?.trim();
      if (!organization) {
        return NextResponse.json(
          { error: 'Organization cannot be empty', code: 'EMPTY_FIELD' },
          { status: 400 }
        );
      }
      updates.organization = organization;
    }

    // Validate and process position
    if ('position' in body) {
      const position = body.position?.trim();
      if (!position) {
        return NextResponse.json(
          { error: 'Position cannot be empty', code: 'EMPTY_FIELD' },
          { status: 400 }
        );
      }
      updates.position = position;
    }

    // Validate and process experience
    if ('experience' in body) {
      const experience = body.experience?.trim();
      if (!experience) {
        return NextResponse.json(
          { error: 'Experience cannot be empty', code: 'EMPTY_FIELD' },
          { status: 400 }
        );
      }
      updates.experience = experience;
    }

    // Process optional secondSpecialty
    if ('secondSpecialty' in body) {
      updates.secondSpecialty = body.secondSpecialty ? body.secondSpecialty.trim() : null;
    }

    // Check if there are any valid updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    // Update the user profile
    const updatedUser = await db
      .update(user)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(user.id, authenticatedUser.id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PATCH /api/user/profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}