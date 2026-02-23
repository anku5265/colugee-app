import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockCourses = [
      { id: 1, name: 'B.Tech Computer Science', code: 'BTCS', department: 'Computer Science', duration: '4 years', students: 450 },
      { id: 2, name: 'B.Tech Electronics', code: 'BTEC', department: 'Electronics', duration: '4 years', students: 380 },
      { id: 3, name: 'B.Tech Mechanical', code: 'BTME', department: 'Mechanical', duration: '4 years', students: 320 }
    ];

    return NextResponse.json({ success: true, data: mockCourses });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const courseData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      data: { id: Date.now(), ...courseData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
