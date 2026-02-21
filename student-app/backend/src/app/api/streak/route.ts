import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// POST - Update daily streak
export async function POST(request: NextRequest) {
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

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('daily_streak, last_activity_date')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if already checked in today
    if (profile.last_activity_date === today) {
      return NextResponse.json({
        success: true,
        streak: profile.daily_streak,
        message: 'Already checked in today',
        alreadyCheckedIn: true,
      });
    }

    // Calculate new streak
    let newStreak = 1;
    if (profile.last_activity_date === yesterday) {
      newStreak = (profile.daily_streak || 0) + 1;
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        daily_streak: newStreak,
        last_activity_date: today,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update streak' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      streak: newStreak,
      message: `Streak updated! ${newStreak} days`,
      alreadyCheckedIn: false,
    });
  } catch (error: any) {
    console.error('Streak update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
