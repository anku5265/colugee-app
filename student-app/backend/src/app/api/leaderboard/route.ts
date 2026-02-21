import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// GET - Fetch leaderboard
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

    // Get top 10 users
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('profiles')
      .select('user_id, full_name, daily_streak, profile_picture_url, department')
      .order('daily_streak', { ascending: false })
      .limit(10);

    if (leaderboardError) {
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Get user's rank
    const { data: allUsers, error: allUsersError } = await supabase
      .from('profiles')
      .select('user_id, daily_streak')
      .order('daily_streak', { ascending: false });

    let userRank = null;
    if (allUsers) {
      userRank = allUsers.findIndex(u => u.user_id === user.id) + 1;
    }

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard || [],
      userRank: userRank,
    });
  } catch (error: any) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
