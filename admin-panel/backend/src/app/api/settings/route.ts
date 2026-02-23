import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockSettings = {
      academicYear: '2025-2026',
      currentSemester: 'Spring 2026',
      attendanceThreshold: 75,
      gradingSystem: 'GPA',
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      lockAttendanceAfterDays: 7,
      feeReminderDays: 15
    };

    return NextResponse.json({ success: true, data: mockSettings });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settingsData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
