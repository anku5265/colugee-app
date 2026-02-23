import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockFees = [
      { id: 1, studentName: 'Rahul Kumar', rollNo: 'CS2021001', totalFee: 120000, paid: 120000, due: 0, status: 'Paid' },
      { id: 2, studentName: 'Priya Patel', rollNo: 'EC2021045', totalFee: 115000, paid: 85000, due: 30000, status: 'Partial' },
      { id: 3, studentName: 'Amit Verma', rollNo: 'ME2021089', totalFee: 110000, paid: 55000, due: 55000, status: 'Pending' },
      { id: 4, studentName: 'Sneha Singh', rollNo: 'CS2021002', totalFee: 120000, paid: 0, due: 120000, status: 'Defaulter' }
    ];

    return NextResponse.json({ success: true, data: mockFees });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const feeData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Fee payment recorded successfully',
      data: { id: Date.now(), ...feeData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
