-- Corrigir política RLS da tabela user_roles para permitir superadmin inserir roles para outros usuários
-- O problema é que a política atual só permite inserir roles quando o user_id = auth.uid()
-- Mas quando superadmin cria um usuário, ele está inserindo roles para OUTRO user_id

-- Remover política restritiva atual (se existir)
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- Criar nova política que permite:
-- 1. Superadmin inserir qualquer role
-- 2. Admin inserir roles para usuários da mesma empresa (exceto superadmin)
CREATE POLICY "Superadmin can insert any role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Admin can insert company roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND company_id = public.get_user_company_id(auth.uid())
  AND role != 'superadmin'::app_role
);

-- Criar política para permitir superadmin deletar qualquer role ao editar usuário
DROP POLICY IF EXISTS "Superadmin can delete any role" ON public.user_roles;

CREATE POLICY "Superadmin can delete any role" 
ON public.user_roles 
FOR DELETE 
USING (
  public.has_role(auth.uid(), 'superadmin'::app_role)
);

-- Política para admin deletar roles da própria empresa
CREATE POLICY "Admin can delete company roles" 
ON public.user_roles 
FOR DELETE 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Permitir superadmin atualizar qualquer role
DROP POLICY IF EXISTS "Superadmin can update any role" ON public.user_roles;

CREATE POLICY "Superadmin can update any role" 
ON public.user_roles 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'superadmin'::app_role)
);