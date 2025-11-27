import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return full user data including role
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      image: user.image,
      phone: user.phone,
      personalEmail: user.personalEmail,
      organization: user.organization,
      position: user.position,
      experience: user.experience,
      secondSpecialty: user.secondSpecialty,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/user/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
