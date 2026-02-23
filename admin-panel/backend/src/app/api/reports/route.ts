import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const mockReports = {
      attendance: [
        { month: 'Jan', percentage: 88.5 },
        { month: 'Feb', percentage: 90.2 }
      ],
      fees: {
        collected: 8500000,
        pending: 1500000,
        defaulters: 45
      },
      academic: {
        passPercentage: 92.3,
        averageGPA: 7.8,
        toppers: 15
      }
    };

    return NextResponse.json({ 
      success: true, 
      data: type === 'all' ? mockReports : mockReports[type as keyof typeof mockReports] 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
