import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// GET - Fetch user connections
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

    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        *,
        user1:profiles!connections_user1_id_fkey(user_id, full_name, profile_picture_url, department),
        user2:profiles!connections_user2_id_fkey(user_id, full_name, profile_picture_url, department)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    // Transform connections to return the other user
    const transformedConnections = connections?.map((conn: any) => {
      const isUser1 = conn.user1_id === user.id;
      return isUser1 ? conn.user2 : conn.user1;
    }) || [];

    return NextResponse.json({
      success: true,
      connections: transformedConnections,
    });
  } catch (error: any) {
    console.error('Connections fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
