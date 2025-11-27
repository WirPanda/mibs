import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Single setting by key
    if (key) {
      const setting = await db.select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (setting.length === 0) {
        return NextResponse.json({ 
          error: 'Setting not found',
          code: 'SETTING_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(setting[0], { status: 200 });
    }

    // List all settings with pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const results = await db.select()
      .from(settings)
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

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Validate key parameter
    if (!key) {
      return NextResponse.json({ 
        error: 'Setting key is required',
        code: 'MISSING_KEY' 
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { value, description } = body;

    // Validate that at least value or description is provided
    if (value === undefined && description === undefined) {
      return NextResponse.json({ 
        error: 'At least one field (value or description) must be provided',
        code: 'NO_UPDATE_FIELDS' 
      }, { status: 400 });
    }

    // Check if setting exists
    const existingSetting = await db.select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (existingSetting.length === 0) {
      return NextResponse.json({ 
        error: 'Setting not found',
        code: 'SETTING_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      value?: string;
      description?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date()
    };

    if (value !== undefined) {
      // Validate value is not empty
      if (typeof value !== 'string' || value.trim() === '') {
        return NextResponse.json({ 
          error: 'Value must be a non-empty string',
          code: 'INVALID_VALUE' 
        }, { status: 400 });
      }
      updateData.value = value.trim();
    }

    if (description !== undefined) {
      updateData.description = description === null ? null : description.trim();
    }

    // Update setting
    const updated = await db.update(settings)
      .set(updateData)
      .where(eq(settings.key, key))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update setting',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}