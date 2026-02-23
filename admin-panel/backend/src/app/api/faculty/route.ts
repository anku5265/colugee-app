import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockFaculty = [
      { 
        id: 1, 
        name: 'Dr. Sharma', 
        employeeId: 'FAC001', 
        department: 'Computer Science', 
        designation: 'Professor',
        email: 'sharma@example.com',
        phone: '9876543220',
        subjects: ['Data Structures', 'Algorithms'],
        status: 'Active'
      },
      { 
        id: 2, 
        name: 'Prof. Singh', 
        employeeId: 'FAC002', 
        department: 'Mechanical', 
        designation: 'Associate Professor',
        email: 'singh@example.com',
        phone: '9876543221',
        subjects: ['Thermodynamics', 'Fluid Mechanics'],
        status: 'Active'
      }
    ];

    return NextResponse.json({ success: true, data: mockFaculty });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const facultyData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Faculty added successfully',
      data: { id: Date.now(), ...facultyData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
