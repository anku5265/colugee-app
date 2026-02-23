import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockSubjects = [
      { id: 1, name: 'Data Structures', code: 'CS301', department: 'Computer Science', credits: 4, faculty: 'Dr. Sharma' },
      { id: 2, name: 'Algorithms', code: 'CS302', department: 'Computer Science', credits: 4, faculty: 'Dr. Sharma' },
      { id: 3, name: 'Database Systems', code: 'CS303', department: 'Computer Science', credits: 3, faculty: 'Prof. Kumar' },
      { id: 4, name: 'Operating Systems', code: 'CS304', department: 'Computer Science', credits: 4, faculty: 'Dr. Verma' }
    ];

    return NextResponse.json({ success: true, data: mockSubjects });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const subjectData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      data: { id: Date.now(), ...subjectData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
