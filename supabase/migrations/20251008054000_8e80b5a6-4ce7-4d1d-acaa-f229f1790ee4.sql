-- Função para sincronizar team_payments com payables
CREATE OR REPLACE FUNCTION sync_team_payment_to_payables()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.payables (
      id,
      company_id,
      type,
      description,
      amount,
      due_date,
      paid_date,
      status,
      payment_method,
      notes,
      team_member_id,
      reference_month,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.company_id,
      'team',
      NEW.description,
      NEW.amount,
      NEW.due_date,
      NEW.paid_date,
      NEW.status,
      NEW.payment_method,
      NEW.notes,
      NEW.team_member_id,
      NEW.reference_month,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      description = EXCLUDED.description,
      amount = EXCLUDED.amount,
      due_date = EXCLUDED.due_date,
      paid_date = EXCLUDED.paid_date,
      status = EXCLUDED.status,
      payment_method = EXCLUDED.payment_method,
      notes = EXCLUDED.notes,
      updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.payables WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END;
$$;

-- Função para sincronizar company_expenses com payables
CREATE OR REPLACE FUNCTION sync_company_expense_to_payables()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.payables (
      id,
      company_id,
      type,
      description,
      amount,
      due_date,
      paid_date,
      status,
      payment_method,
      notes,
      expense_category,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.company_id,
      'expense',
      NEW.item,
      NEW.amount,
      NEW.due_date,
      NEW.paid_date,
      NEW.status::text,
      NEW.payment_method,
      NEW.notes,
      NEW.category,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      description = EXCLUDED.description,
      amount = EXCLUDED.amount,
      due_date = EXCLUDED.due_date,
      paid_date = EXCLUDED.paid_date,
      status = EXCLUDED.status,
      payment_method = EXCLUDED.payment_method,
      notes = EXCLUDED.notes,
      expense_category = EXCLUDED.expense_category,
      updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.payables WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END;
$$;

-- Função para sincronizar partner_commissions com payables
CREATE OR REPLACE FUNCTION sync_partner_commission_to_payables()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.payables (
      id,
      company_id,
      type,
      description,
      amount,
      due_date,
      paid_date,
      status,
      payment_method,
      notes,
      partner_id,
      client_id,
      reference_month,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.company_id,
      'commission',
      COALESCE(NEW.notes, 'Comissão de parceiro'),
      NEW.commission_amount,
      NEW.scheduled_payment_date::timestamp with time zone,
      NEW.paid_date,
      NEW.status,
      NEW.payment_method,
      NEW.notes,
      NEW.partner_id,
      NEW.client_id,
      NEW.reference_month,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      description = EXCLUDED.description,
      amount = EXCLUDED.amount,
      due_date = EXCLUDED.due_date,
      paid_date = EXCLUDED.paid_date,
      status = EXCLUDED.status,
      payment_method = EXCLUDED.payment_method,
      notes = EXCLUDED.notes,
      updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.payables WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END;
$$;

-- Criar triggers para team_payments
DROP TRIGGER IF EXISTS sync_team_payment_trigger ON public.team_payments;
CREATE TRIGGER sync_team_payment_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.team_payments
FOR EACH ROW
EXECUTE FUNCTION sync_team_payment_to_payables();

-- Criar triggers para company_expenses
DROP TRIGGER IF EXISTS sync_company_expense_trigger ON public.company_expenses;
CREATE TRIGGER sync_company_expense_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.company_expenses
FOR EACH ROW
EXECUTE FUNCTION sync_company_expense_to_payables();

-- Criar triggers para partner_commissions
DROP TRIGGER IF EXISTS sync_partner_commission_trigger ON public.partner_commissions;
CREATE TRIGGER sync_partner_commission_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.partner_commissions
FOR EACH ROW
EXECUTE FUNCTION sync_partner_commission_to_payables();

-- Sincronizar dados pendentes (criados após a migração inicial)
INSERT INTO public.payables (
  id,
  company_id,
  type,
  description,
  amount,
  due_date,
  paid_date,
  status,
  payment_method,
  notes,
  team_member_id,
  reference_month,
  created_at,
  updated_at
)
SELECT 
  tp.id,
  tp.company_id,
  'team' as type,
  tp.description,
  tp.amount,
  tp.due_date,
  tp.paid_date,
  tp.status,
  tp.payment_method,
  tp.notes,
  tp.team_member_id,
  tp.reference_month,
  tp.created_at,
  tp.updated_at
FROM public.team_payments tp
WHERE NOT EXISTS (
  SELECT 1 FROM public.payables p WHERE p.id = tp.id
);

INSERT INTO public.payables (
  id,
  company_id,
  type,
  description,
  amount,
  due_date,
  paid_date,
  status,
  payment_method,
  notes,
  expense_category,
  created_at,
  updated_at
)
SELECT 
  ce.id,
  ce.company_id,
  'expense' as type,
  ce.item as description,
  ce.amount,
  ce.due_date,
  ce.paid_date,
  ce.status::text,
  ce.payment_method,
  ce.notes,
  ce.category as expense_category,
  ce.created_at,
  ce.updated_at
FROM public.company_expenses ce
WHERE NOT EXISTS (
  SELECT 1 FROM public.payables p WHERE p.id = ce.id
);

INSERT INTO public.payables (
  id,
  company_id,
  type,
  description,
  amount,
  due_date,
  paid_date,
  status,
  payment_method,
  notes,
  partner_id,
  client_id,
  reference_month,
  created_at,
  updated_at
)
SELECT 
  pc.id,
  pc.company_id,
  'commission' as type,
  COALESCE(pc.notes, 'Comissão de parceiro') as description,
  pc.commission_amount,
  pc.scheduled_payment_date::timestamp with time zone,
  pc.paid_date,
  pc.status,
  pc.payment_method,
  pc.notes,
  pc.partner_id,
  pc.client_id,
  pc.reference_month,
  pc.created_at,
  pc.updated_at
FROM public.partner_commissions pc
WHERE NOT EXISTS (
  SELECT 1 FROM public.payables p WHERE p.id = pc.id
);