import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Auth email hook received:", JSON.stringify(payload, null, 2));

    const { user, email_data } = payload;
    
    if (!user?.email) {
      console.error("No user email provided");
      return new Response(JSON.stringify({ error: "No user email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token, token_hash, redirect_to, email_action_type } = email_data || {};
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    let subject = "";
    let htmlContent = "";
    
    const confirmationLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || ''}`;

    switch (email_action_type) {
      case "signup":
      case "email":
        subject = "Welcome to Campus Connect - Confirm Your Email";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Welcome to Campus Connect!</h1>
            <p style="color: #666; font-size: 16px;">Hi ${user.user_metadata?.full_name || 'there'},</p>
            <p style="color: #666; font-size: 16px;">Thanks for signing up! Please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" 
                 style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Confirm Email Address
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${confirmationLink}</p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
              If you didn't sign up for Campus Connect, you can safely ignore this email.
            </p>
          </div>
        `;
        break;

      case "recovery":
      case "magiclink":
        subject = "Reset Your Password - Campus Connect";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
            <p style="color: #666; font-size: 16px;">Hi ${user.user_metadata?.full_name || 'there'},</p>
            <p style="color: #666; font-size: 16px;">We received a request to reset your password. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" 
                 style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #e74c3c; font-size: 14px;"><strong>This link expires in 1 hour.</strong></p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `;
        break;

      case "email_change":
        subject = "Confirm Your New Email - Campus Connect";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Email Change Request</h1>
            <p style="color: #666; font-size: 16px;">Hi ${user.user_metadata?.full_name || 'there'},</p>
            <p style="color: #666; font-size: 16px;">Please confirm your new email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" 
                 style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Confirm New Email
              </a>
            </div>
          </div>
        `;
        break;

      default:
        subject = "Campus Connect Notification";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Campus Connect</h1>
            <p style="color: #666;">Click the link below to continue:</p>
            <a href="${confirmationLink}">${confirmationLink}</a>
          </div>
        `;
    }

    console.log("Sending email to:", user.email, "Type:", email_action_type);

    const { data, error } = await resend.emails.send({
      from: "Campus Connect <onboarding@resend.dev>",
      to: [user.email],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email sent successfully:", data);
    
    // Return empty object to indicate success (required by Supabase auth hook)
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in send-auth-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
