import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a secure random password
function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the calling user is authenticated and has authority role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify their identity
    const supabaseAnonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the calling user has authority role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, institution_id')
      .eq('user_id', callingUser.id)
      .single();

    if (profileError || !callerProfile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Could not verify user role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role !== 'authority') {
      return new Response(
        JSON.stringify({ error: 'Only authorities can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body - admin-controlled fields only (no password)
    const { 
      email, 
      full_name, 
      role, 
      department, 
      year_of_study, 
      institution_roll_number,
      phone_number,
      Course,
      section,
      branch
    } = await req.json();

    // Validate required fields
    if (!email || !full_name || !role || !department) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, full_name, role, department' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['student', 'mentor', 'teacher', 'authority'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be one of: student, mentor, teacher, authority' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-generate a secure password
    const generatedPassword = generatePassword(12);

    console.log('Creating user with email:', email, 'role:', role);

    // Create user in Supabase Auth with metadata
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role,
        institution_id: callerProfile.institution_id,
        institution_roll_number: institution_roll_number || null,
        department,
        year_of_study: year_of_study ? parseInt(year_of_study) : null
      }
    });

    if (createError) {
      console.error('User creation error:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', newUser.user?.id);

    // Update additional profile fields that aren't in user_metadata
    if (newUser.user) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          phone_number: phone_number || null,
          Course: Course || null,
          section: section || null,
          branch: branch || null
        })
        .eq('user_id', newUser.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Don't fail the request, user was created successfully
      }
    }

    // Send email with login credentials
    try {
      const { error: emailError } = await resend.emails.send({
        from: 'Campus Connect <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Campus Connect - Your Login Credentials',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Welcome to Campus Connect!</h1>
            <p style="color: #666; font-size: 16px;">Hello ${full_name},</p>
            <p style="color: #666; font-size: 16px;">Your account has been created by the administrator. Here are your login credentials:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Password:</strong> ${generatedPassword}</p>
              <p style="margin: 10px 0;"><strong>Role:</strong> ${role}</p>
              <p style="margin: 10px 0;"><strong>Department:</strong> ${department}</p>
            </div>
            
            <p style="color: #e74c3c; font-size: 14px;"><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
            
            <p style="color: #666; font-size: 16px;">If you have any questions, please contact your institution administrator.</p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `,
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request, user was created successfully
      } else {
        console.log('Welcome email sent successfully to:', email);
      }
    } catch (emailErr) {
      console.error('Email service error:', emailErr);
      // Don't fail the request, user was created successfully
    }

    // Log the action
    await supabaseAdmin.rpc('log_authority_action', {
      p_action_type: 'create_user',
      p_target_user_id: newUser.user?.id,
      p_details: { 
        user_name: full_name, 
        user_email: email, 
        user_role: role,
        created_by: callingUser.id
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user?.id, 
          email: newUser.user?.email 
        },
        message: 'User created successfully. Login credentials sent to their email.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
