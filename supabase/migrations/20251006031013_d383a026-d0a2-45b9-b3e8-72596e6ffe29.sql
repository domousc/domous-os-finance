-- ============================================
-- DOMOUS OS - SISTEMA MULTI-TENANT
-- ============================================

-- Criar enum para roles (5 níveis de acesso)
CREATE TYPE public.app_role AS ENUM (
  'superadmin',      -- Gerencia todo o sistema
  'admin',           -- Administrador da empresa
  'gestor',          -- Gestor da empresa
  'financeiro',      -- Financeiro da empresa
  'operador'         -- Operador da empresa
);

-- Criar enum para status de planos
CREATE TYPE public.plan_status AS ENUM (
  'active',
  'inactive'
);

-- Criar enum para status de assinaturas
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'pending',
  'cancelled',
  'expired',
  'trial'
);

-- ============================================
-- TABELA: PLANOS
-- ============================================
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_companies INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  status plan_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: EMPRESAS (Multi-tenant)
-- ============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: ASSINATURAS
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trial',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  payment_method TEXT,
  asaas_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: PERFIS DE USUÁRIOS
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABELA: ROLES DOS USUÁRIOS (Separada por segurança)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, company_id)
);

-- ============================================
-- TABELA: CONFIGURAÇÕES DO SISTEMA
-- ============================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÃO DE SEGURANÇA: Verificar role do usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- FUNÇÃO: Obter company_id do usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- ============================================
-- RLS POLICIES - PLANS
-- ============================================
-- Superadmin pode tudo em plans
CREATE POLICY "Superadmin full access plans"
ON public.plans
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Todos podem visualizar planos ativos
CREATE POLICY "Everyone can view active plans"
ON public.plans
FOR SELECT
USING (status = 'active');

-- ============================================
-- RLS POLICIES - COMPANIES
-- ============================================
-- Superadmin pode tudo
CREATE POLICY "Superadmin full access companies"
ON public.companies
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Usuários podem ver sua própria empresa
CREATE POLICY "Users can view own company"
ON public.companies
FOR SELECT
USING (id = public.get_user_company_id(auth.uid()));

-- Admin pode atualizar sua empresa
CREATE POLICY "Admin can update own company"
ON public.companies
FOR UPDATE
USING (
  id = public.get_user_company_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- RLS POLICIES - SUBSCRIPTIONS
-- ============================================
-- Superadmin pode tudo
CREATE POLICY "Superadmin full access subscriptions"
ON public.subscriptions
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Usuários podem ver assinatura da própria empresa
CREATE POLICY "Users can view own company subscription"
ON public.subscriptions
FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()));

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
-- Superadmin pode tudo
CREATE POLICY "Superadmin full access profiles"
ON public.profiles
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

-- Admin/Gestor podem ver perfis da empresa
CREATE POLICY "Admin/Gestor can view company profiles"
ON public.profiles
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'gestor')
  )
);

-- ============================================
-- RLS POLICIES - USER_ROLES
-- ============================================
-- Superadmin pode tudo
CREATE POLICY "Superadmin full access user_roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Admin pode ver roles da empresa
CREATE POLICY "Admin can view company roles"
ON public.user_roles
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- RLS POLICIES - SYSTEM_SETTINGS
-- ============================================
-- Superadmin pode tudo
CREATE POLICY "Superadmin full access system_settings"
ON public.system_settings
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- ============================================
-- TRIGGERS: Updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER: Criar perfil automaticamente ao criar usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'company_id')::uuid
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CRIAR PLANOS INICIAIS
-- ============================================
INSERT INTO public.plans (name, description, price, max_users, features, status)
VALUES 
  ('Gratuito', 'Plano básico para testar o sistema', 0, 3, 
   '["Dashboard básico", "1 empresa", "Suporte por email"]'::jsonb, 'active'),
  ('Starter', 'Ideal para pequenas empresas', 99.90, 10, 
   '["Dashboard completo", "5 empresas", "Suporte prioritário", "Relatórios básicos"]'::jsonb, 'active'),
  ('Professional', 'Para empresas em crescimento', 299.90, 50, 
   '["Dashboard avançado", "Empresas ilimitadas", "Suporte 24/7", "Relatórios avançados", "API access"]'::jsonb, 'active'),
  ('Enterprise', 'Solução completa para grandes empresas', 999.90, 999, 
   '["Tudo do Professional", "Customizações", "SLA garantido", "Treinamento", "Gerente dedicado"]'::jsonb, 'active');
