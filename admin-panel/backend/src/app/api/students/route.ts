import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockStudents = [
      { 
        id: 1, 
        name: 'Rahul Kumar', 
        rollNo: 'CS2021001', 
        department: 'Computer Science', 
        batch: '2021-2025',
        email: 'rahul@example.com',
        phone: '9876543210',
        status: 'Active',
        attendance: 92.5
      },
      { 
        id: 2, 
        name: 'Priya Patel', 
        rollNo: 'EC2021045', 
        department: 'Electronics', 
        batch: '2021-2025',
        email: 'priya@example.com',
        phone: '9876543211',
        status: 'Active',
        attendance: 88.3
      },
      { 
        id: 3, 
        name: 'Amit Verma', 
        rollNo: 'ME2021089', 
        department: 'Mechanical', 
        batch: '2021-2025',
        email: 'amit@example.com',
        phone: '9876543212',
        status: 'Active',
        attendance: 75.8
      }
    ];

    return NextResponse.json({ success: true, data: mockStudents });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Student added successfully',
      data: { id: Date.now(), ...studentData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
