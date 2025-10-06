import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { userId, email, fullName, companyName } = await req.json();

    console.log('Processing signup for user:', userId);

    // 1. Criar a empresa
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .insert({
        name: companyName,
        email: email,
        status: 'active',
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      throw companyError;
    }

    console.log('Company created:', company.id);

    // 2. Atualizar o perfil com o company_id
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        company_id: company.id,
        full_name: fullName 
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    console.log('Profile updated with company_id');

    // 3. Atribuir role de admin ao usuário
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        company_id: company.id,
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      throw roleError;
    }

    console.log('Admin role assigned to user');

    return new Response(
      JSON.stringify({ 
        success: true, 
        companyId: company.id,
        message: 'User setup completed successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in handle-user-signup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to complete user signup setup'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});