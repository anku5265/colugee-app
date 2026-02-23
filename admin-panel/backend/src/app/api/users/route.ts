import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockUsers = [
      { id: 1, name: 'Rahul Kumar', role: 'Student', department: 'Computer Science', status: 'Active', email: 'rahul@example.com' },
      { id: 2, name: 'Dr. Sharma', role: 'Faculty', department: 'Computer Science', status: 'Active', email: 'sharma@example.com' },
      { id: 3, name: 'Priya Patel', role: 'Student', department: 'Electronics', status: 'Active', email: 'priya@example.com' },
      { id: 4, name: 'Prof. Singh', role: 'Faculty', department: 'Mechanical', status: 'Active', email: 'singh@example.com' },
      { id: 5, name: 'Amit Verma', role: 'Student', department: 'Civil', status: 'Inactive', email: 'amit@example.com' }
    ];

    return NextResponse.json({ success: true, data: mockUsers });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { id: Date.now(), ...userData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
