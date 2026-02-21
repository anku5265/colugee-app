import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// GET - Fetch institution statistics
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('institution_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['teacher', 'authority'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get counts
    const { count: studentsTotal } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', profile.institution_id)
      .eq('role', 'student');

    const { count: mentorsTotal } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', profile.institution_id)
      .eq('role', 'mentor');

    const { count: teachersTotal } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', profile.institution_id)
      .eq('role', 'teacher');

    const { count: eventsTotal } = await supabase
      .from('campus_events')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: studentsTotal || 0,
        totalMentors: mentorsTotal || 0,
        totalTeachers: teachersTotal || 0,
        activeEvents: eventsTotal || 0,
      },
    });
  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
