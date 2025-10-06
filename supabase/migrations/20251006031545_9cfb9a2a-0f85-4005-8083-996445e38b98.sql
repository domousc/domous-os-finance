-- Habilitar extensão necessária para gerar hash de senha
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Função temporária para criar superadmin com senha segura
CREATE OR REPLACE FUNCTION public.create_superadmin(
  p_email TEXT,
  p_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Evitar duplicidade
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin"}'
  )
  RETURNING id INTO v_user_id;

  -- Garantir role de superadmin
  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (v_user_id, 'superadmin', NULL)
  ON CONFLICT DO NOTHING;

  RETURN v_user_id;
END;
$$;

-- Executar criação do superadmin
SELECT public.create_superadmin('fabiozesk@gmail.com', '12345678');

-- Remover a função após o uso
DROP FUNCTION IF EXISTS public.create_superadmin(TEXT, TEXT);