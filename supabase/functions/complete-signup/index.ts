
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username, password, role } = await req.json();
    console.log(`🔐 Processing signup completion for email: ${email}, username: ${username}, role: ${role}`);
    
    if (!email || !username || !password || !role) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ success: false, message: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists and get their assigned role
    console.log(`🔍 Looking up user by email: ${email}`);
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !existingUser) {
      console.error('❌ User not found:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ User found with assigned role: ${existingUser.role}`);

    // Check if the role matches
    if (existingUser.role.toLowerCase() !== role.toLowerCase()) {
      console.error(`❌ Role mismatch. Expected: ${existingUser.role}, Provided: ${role}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `You are not authorized for the ${role} role. Your assigned role is ${existingUser.role}.` 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if username is already taken
    console.log(`🔍 Checking if username is available: ${username}`);
    const { data: usernameCheck } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .neq('email', email);

    if (usernameCheck && usernameCheck.length > 0) {
      console.error(`❌ Username already taken: ${username}`);
      return new Response(
        JSON.stringify({ success: false, message: "Username is already taken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Username is available');

    // Hash the password using bcrypt
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password);
    console.log('✅ Password hashed successfully');

    // Update user with username and hashed password
    console.log('💾 Updating user record...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        username: username,
        password: hashedPassword
      })
      .eq('email', email);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to complete signup" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ User record updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Signup completed successfully",
        user: {
          email: email,
          username: username,
          role: existingUser.role
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Unexpected error in complete-signup:', error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
