import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockDepartments = [
      { id: 1, name: 'Computer Science', code: 'CS', hod: 'Dr. Sharma', students: 450, faculty: 25 },
      { id: 2, name: 'Electronics', code: 'EC', hod: 'Dr. Patel', students: 380, faculty: 20 },
      { id: 3, name: 'Mechanical', code: 'ME', hod: 'Prof. Singh', students: 320, faculty: 18 },
      { id: 4, name: 'Civil', code: 'CE', hod: 'Dr. Kumar', students: 280, faculty: 15 }
    ];

    return NextResponse.json({ success: true, data: mockDepartments });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const deptData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Department created successfully',
      data: { id: Date.now(), ...deptData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
