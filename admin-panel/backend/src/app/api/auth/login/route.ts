import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Mock authentication - accept any credentials for demo
    if (email && password) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin-001',
          email: email,
          name: 'Admin User',
          role: 'admin'
        },
        token: 'mock-jwt-token-' + Date.now()
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
