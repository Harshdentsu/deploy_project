
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
    const { username, password, role } = await req.json();
    console.log(`🔐 Processing login attempt for username: ${username}, role: ${role}`);
    
    if (!username || !password || !role) {
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

    // Look up user by username
    console.log(`🔍 Looking up user by username: ${username}`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ User found: ${user.username}, Role: ${user.role}`);

    // Check if role matches
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      console.error(`❌ Role mismatch. Expected: ${role}, User has: ${user.role}`);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password using bcrypt
    console.log('🔐 Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.error('❌ Password verification failed');
      return new Response(
        JSON.stringify({ success: false, message: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Password verified successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Login successful",
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          dealer_id: user.dealer_id
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Unexpected error in secure-login:', error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
