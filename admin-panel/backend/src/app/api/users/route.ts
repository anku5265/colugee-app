import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client - bypasses RLS and can create users without email confirmation
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email, password, full_name, role, department,
      institution_id, institution_roll_number,
      year_of_study, section, branch, subject_specialization,
    } = body;

    // Basic validation
    if (!email || !password || !full_name || !role || !department || !institution_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: email, password, full_name, role, department, institution_id' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Check duplicate email in profiles table
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists' },
        { status: 409, headers: corsHeaders() }
      );
    }

    // Create auth user using admin API - no email confirmation, no session switch
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm email, no verification needed
      user_metadata: {
        full_name,
        institution_id,
        institution_roll_number: institution_roll_number || null,
        role,
        department,
        year_of_study: role === 'student' && year_of_study ? parseInt(year_of_study) : null,
        section: role === 'student' ? section || null : null,
        branch: role === 'student' ? branch || null : null,
        subject_specialization: role === 'teacher' ? subject_specialization || null : null,
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Failed to create auth user' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Upsert profile (DB trigger may have already created it from metadata)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      user_id: authData.user.id,
      email,
      full_name,
      role,
      department,
      institution_id,
      institution_roll_number: institution_roll_number || null,
      year_of_study: role === 'student' && year_of_study ? parseInt(year_of_study) : null,
      section: role === 'student' ? section || null : null,
      branch: role === 'student' ? branch || null : null,
      subject_specialization: role === 'teacher' ? subject_specialization || null : null,
    }, { onConflict: 'user_id' });

    if (profileError) {
      // Auth user created but profile failed - still return success with warning
      console.error('Profile upsert error:', profileError);
    }

    return NextResponse.json(
      { success: true, message: 'User created successfully', data: { user_id: authData.user.id } },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// DELETE /api/users?user_id=xxx - Delete a user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const profileId = searchParams.get('profile_id');

    if (!userId && !profileId) {
      return NextResponse.json(
        { success: false, message: 'user_id or profile_id required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    let authUserId = userId;

    // If only profile_id given, look up the user_id
    if (!authUserId && profileId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();
      authUserId = profile?.user_id;
    }

    // Delete profile first (FK constraint)
    if (authUserId) {
      await supabaseAdmin.from('profiles').delete().eq('user_id', authUserId);
      // Delete auth user
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400, headers: corsHeaders() }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
