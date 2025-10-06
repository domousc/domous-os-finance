import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password?: string;
  full_name: string;
  phone?: string;
  company_id: string;
  avatar_url?: string;
  roles: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Verify caller's identity using the anon key client
    const supabaseAnon = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data: { user: caller }, error: callerError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (callerError || !caller) {
      console.error('Caller verification error:', callerError);
      throw new Error('Não autorizado');
    }

    console.log('Caller verified:', caller.id);

    // Check if caller has superadmin or admin role
    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', caller.id);

    if (rolesError) {
      console.error('Error fetching caller roles:', rolesError);
      throw new Error('Erro ao verificar permissões');
    }

    const isSuperAdmin = callerRoles?.some((r) => r.role === 'superadmin');
    const isAdmin = callerRoles?.some((r) => r.role === 'admin');

    if (!isSuperAdmin && !isAdmin) {
      throw new Error('Permissão negada: apenas superadmin ou admin podem criar usuários');
    }

    console.log('Caller is authorized:', { isSuperAdmin, isAdmin });

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, phone, company_id, avatar_url, roles } = body;

    // Validate required fields
    if (!email || !full_name || !company_id || !roles || roles.length === 0) {
      throw new Error('Campos obrigatórios faltando: email, full_name, company_id, roles');
    }

    // Admin users can only create users in their own company and can't assign superadmin
    if (isAdmin && !isSuperAdmin) {
      const adminCompanyId = callerRoles?.find((r) => r.role === 'admin')?.company_id;
      
      if (adminCompanyId !== company_id) {
        throw new Error('Admin só pode criar usuários na própria empresa');
      }

      if (roles.includes('superadmin')) {
        throw new Error('Admin não pode criar usuários com role superadmin');
      }
    }

    // Optional: Check if company has active subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('company_id', company_id)
      .single();

    if (subscription && !['active', 'trial'].includes(subscription.status)) {
      throw new Error('Empresa sem assinatura ativa');
    }

    console.log('Creating user with email:', email);

    // Create user via admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-8),
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        company_id,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error(`Erro ao criar usuário: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('Usuário não foi criado');
    }

    console.log('User created successfully:', newUser.user.id);

    // Update profile with additional fields
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone: phone || null,
        avatar_url: avatar_url || null,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't throw, profile update is not critical
    }

    // Insert roles
    const rolesData = roles.map((role) => ({
      user_id: newUser.user.id,
      role,
      company_id,
    }));

    const { error: rolesInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert(rolesData);

    if (rolesInsertError) {
      console.error('Error inserting roles:', rolesInsertError);
      // Try to delete the user if role insertion fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Erro ao atribuir roles: ${rolesInsertError.message}`);
    }

    console.log('Roles inserted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        message: 'Usuário criado com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
