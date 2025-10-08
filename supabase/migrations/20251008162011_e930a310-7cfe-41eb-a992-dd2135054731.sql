-- ⚠️ ATENÇÃO: ESTA MIGRAÇÃO REMOVE TODA A SEGURANÇA DO BANCO DE DADOS
-- Todos os dados ficarão acessíveis para qualquer usuário autenticado

-- Desabilitar RLS em todas as tabelas
ALTER TABLE public.client_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_client_agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies de client_services
DROP POLICY IF EXISTS "Admin can manage company client services" ON public.client_services;
DROP POLICY IF EXISTS "Superadmin full access client_services" ON public.client_services;
DROP POLICY IF EXISTS "Users can view company client services" ON public.client_services;

-- Remover todas as policies de clients
DROP POLICY IF EXISTS "Admin can manage company clients" ON public.clients;
DROP POLICY IF EXISTS "Superadmin full access clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view company clients" ON public.clients;

-- Remover todas as policies de commissions
DROP POLICY IF EXISTS "Admin can manage company commissions" ON public.commissions;
DROP POLICY IF EXISTS "Superadmin full access commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can view company commissions" ON public.commissions;

-- Remover todas as policies de companies
DROP POLICY IF EXISTS "Admin can update own company" ON public.companies;
DROP POLICY IF EXISTS "Superadmin full access companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;

-- Remover todas as policies de company_expenses
DROP POLICY IF EXISTS "Admin can manage company expenses" ON public.company_expenses;
DROP POLICY IF EXISTS "Superadmin full access company_expenses" ON public.company_expenses;
DROP POLICY IF EXISTS "Users can view company expenses" ON public.company_expenses;

-- Remover todas as policies de company_settings
DROP POLICY IF EXISTS "Admin can manage company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Superadmin full access company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can view company settings" ON public.company_settings;

-- Remover todas as policies de invoices
DROP POLICY IF EXISTS "Admin can manage company invoices" ON public.invoices;
DROP POLICY IF EXISTS "Superadmin full access invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view company invoices" ON public.invoices;

-- Remover todas as policies de partner_client_agreements
DROP POLICY IF EXISTS "Admin can manage company agreements" ON public.partner_client_agreements;
DROP POLICY IF EXISTS "Superadmin full access agreements" ON public.partner_client_agreements;
DROP POLICY IF EXISTS "Users can view company agreements" ON public.partner_client_agreements;

-- Remover todas as policies de partner_commissions
DROP POLICY IF EXISTS "Admin can manage company partner commissions" ON public.partner_commissions;
DROP POLICY IF EXISTS "Superadmin full access partner_commissions" ON public.partner_commissions;
DROP POLICY IF EXISTS "Users can view company partner commissions" ON public.partner_commissions;

-- Remover todas as policies de partners
DROP POLICY IF EXISTS "Admin can manage company partners" ON public.partners;
DROP POLICY IF EXISTS "Superadmin full access partners" ON public.partners;
DROP POLICY IF EXISTS "Users can view company partners" ON public.partners;

-- Remover todas as policies de payables
DROP POLICY IF EXISTS "Admin can manage company payables" ON public.payables;
DROP POLICY IF EXISTS "Superadmin full access payables" ON public.payables;
DROP POLICY IF EXISTS "Users can view company payables" ON public.payables;

-- Remover todas as policies de personal_transactions
DROP POLICY IF EXISTS "Users can create own transactions" ON public.personal_transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.personal_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.personal_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.personal_transactions;

-- Remover todas as policies de plans
DROP POLICY IF EXISTS "Everyone can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Superadmin full access plans" ON public.plans;

-- Remover todas as policies de profiles
DROP POLICY IF EXISTS "Admin/Gestor can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Remover todas as policies de services
DROP POLICY IF EXISTS "Admin can delete company services" ON public.services;
DROP POLICY IF EXISTS "Admin can insert company services" ON public.services;
DROP POLICY IF EXISTS "Admin can update company services" ON public.services;
DROP POLICY IF EXISTS "Admin can view company services" ON public.services;
DROP POLICY IF EXISTS "Superadmin full access services" ON public.services;
DROP POLICY IF EXISTS "Users can view company services" ON public.services;

-- Remover todas as policies de subscriptions
DROP POLICY IF EXISTS "Superadmin full access subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own company subscription" ON public.subscriptions;

-- Remover todas as policies de system_settings
DROP POLICY IF EXISTS "Superadmin full access system_settings" ON public.system_settings;

-- Remover todas as policies de team_members
DROP POLICY IF EXISTS "Admin can manage company team members" ON public.team_members;
DROP POLICY IF EXISTS "Superadmin full access team_members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view company team members" ON public.team_members;

-- Remover todas as policies de team_payments
DROP POLICY IF EXISTS "Admin can manage company team payments" ON public.team_payments;
DROP POLICY IF EXISTS "Superadmin full access team_payments" ON public.team_payments;
DROP POLICY IF EXISTS "Users can view company team payments" ON public.team_payments;

-- Remover todas as policies de user_roles
DROP POLICY IF EXISTS "Admin can delete company roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can insert company roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view company roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin can delete any role" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin can insert any role" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin can update any role" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin full access user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;