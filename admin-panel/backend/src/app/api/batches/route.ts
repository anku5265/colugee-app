import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockBatches = [
      { id: 1, name: '2021-2025', course: 'B.Tech CS', year: '4th Year', students: 120, status: 'Active' },
      { id: 2, name: '2022-2026', course: 'B.Tech CS', year: '3rd Year', students: 115, status: 'Active' },
      { id: 3, name: '2023-2027', course: 'B.Tech CS', year: '2nd Year', students: 110, status: 'Active' },
      { id: 4, name: '2024-2028', course: 'B.Tech CS', year: '1st Year', students: 105, status: 'Active' }
    ];

    return NextResponse.json({ success: true, data: mockBatches });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const batchData = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Batch created successfully',
      data: { id: Date.now(), ...batchData }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
