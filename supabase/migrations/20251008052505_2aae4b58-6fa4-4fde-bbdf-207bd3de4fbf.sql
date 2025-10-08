-- ==================================================
-- FASE 1: Criar Estrutura Unificada
-- ==================================================

-- Criar tabela payables unificada
CREATE TABLE IF NOT EXISTS public.payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Identificação
  type TEXT NOT NULL CHECK (type IN ('team', 'expense', 'commission')),
  description TEXT NOT NULL,
  
  -- Valores
  amount NUMERIC NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  
  -- Referências opcionais
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  expense_category TEXT,
  
  -- Metadados
  reference_month DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_payables_company_id ON public.payables(company_id);
CREATE INDEX idx_payables_type ON public.payables(type);
CREATE INDEX idx_payables_status ON public.payables(status);
CREATE INDEX idx_payables_due_date ON public.payables(due_date);

-- ==================================================
-- FASE 2: Migração de Dados Limpa
-- ==================================================

-- 2.1 - Limpar duplicatas de Flávia e Kelvin (manter apenas os primeiros IDs)
DELETE FROM public.team_payments 
WHERE team_member_id IN (
  '02bd80a7-35af-4b02-878a-3d74b7cb0c09', -- Flávia duplicata
  '7d65e9df-d9d5-4158-ab03-c4c0d91d22b4'  -- Kelvin duplicata
);

DELETE FROM public.team_members 
WHERE id IN (
  '02bd80a7-35af-4b02-878a-3d74b7cb0c09', -- Flávia duplicata
  '7d65e9df-d9d5-4158-ab03-c4c0d91d22b4'  -- Kelvin duplicata
);

-- 2.2 - Migrar pagamentos de equipe
INSERT INTO public.payables (
  company_id, type, description, amount, due_date, paid_date, 
  status, payment_method, team_member_id, reference_month, notes
)
SELECT 
  tp.company_id,
  'team'::TEXT,
  COALESCE(tm.name, 'Membro Desconhecido'),
  tp.amount,
  tp.due_date,
  tp.paid_date,
  tp.status,
  tp.payment_method,
  tp.team_member_id,
  tp.reference_month,
  tp.notes
FROM public.team_payments tp
LEFT JOIN public.team_members tm ON tp.team_member_id = tm.id;

-- 2.3 - Migrar despesas operacionais
INSERT INTO public.payables (
  company_id, type, description, amount, due_date, paid_date, 
  status, payment_method, expense_category, notes
)
SELECT 
  company_id,
  'expense'::TEXT,
  item,
  amount,
  due_date,
  paid_date,
  status::TEXT,
  payment_method,
  category,
  notes
FROM public.company_expenses;

-- 2.4 - Migrar comissões de parceiros
INSERT INTO public.payables (
  company_id, type, description, amount, due_date, paid_date, 
  status, payment_method, partner_id, client_id, reference_month, notes
)
SELECT 
  pc.company_id,
  'commission'::TEXT,
  COALESCE(p.name || ' - Comissão', 'Comissão'),
  pc.commission_amount,
  pc.scheduled_payment_date::TIMESTAMPTZ,
  pc.paid_date,
  pc.status,
  pc.payment_method,
  pc.partner_id,
  pc.client_id,
  pc.reference_month,
  pc.notes
FROM public.partner_commissions pc
LEFT JOIN public.partners p ON pc.partner_id = p.id;

-- ==================================================
-- FASE 4: RLS e Segurança
-- ==================================================

-- Habilitar RLS
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- Política para visualização
CREATE POLICY "Users can view company payables"
ON public.payables
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Política para administradores gerenciarem
CREATE POLICY "Admin can manage company payables"
ON public.payables
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Política para superadmin
CREATE POLICY "Superadmin full access payables"
ON public.payables
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payables_updated_at
  BEFORE UPDATE ON public.payables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();