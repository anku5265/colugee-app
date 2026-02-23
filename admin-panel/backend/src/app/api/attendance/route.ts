import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockAttendance = [
      { id: 1, date: '2026-02-22', batch: '2021-2025', subject: 'Data Structures', present: 108, absent: 12, percentage: 90.0 },
      { id: 2, date: '2026-02-22', batch: '2022-2026', subject: 'Algorithms', present: 102, absent: 13, percentage: 88.7 },
      { id: 3, date: '2026-02-21', batch: '2021-2025', subject: 'Database Systems', present: 110, absent: 10, percentage: 91.7 }
    ];

    return NextResponse.json({ success: true, data: mockAttendance });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const attendanceData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: { id: Date.now(), ...attendanceData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
