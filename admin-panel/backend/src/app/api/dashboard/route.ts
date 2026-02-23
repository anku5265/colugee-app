import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock dashboard data
    const dashboardData = {
      kpis: {
        totalStudents: 1250,
        totalFaculty: 85,
        activeEvents: 12,
        totalAudits: 342,
        trends: {
          students: 5.2,
          faculty: 2.1,
          events: -1.5,
          audits: 8.3
        }
      },
      recentActivities: [
        { id: 1, type: 'student', action: 'New student enrolled', user: 'Rahul Kumar', time: '2 mins ago' },
        { id: 2, type: 'faculty', action: 'Faculty profile updated', user: 'Dr. Sharma', time: '15 mins ago' },
        { id: 3, type: 'event', action: 'Event created', user: 'Admin', time: '1 hour ago' },
        { id: 4, type: 'attendance', action: 'Attendance marked', user: 'Prof. Singh', time: '2 hours ago' },
        { id: 5, type: 'fees', action: 'Fee payment received', user: 'Priya Patel', time: '3 hours ago' }
      ],
      quickStats: {
        presentToday: 1089,
        absentToday: 161,
        pendingFees: 45,
        upcomingEvents: 3
      }
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
