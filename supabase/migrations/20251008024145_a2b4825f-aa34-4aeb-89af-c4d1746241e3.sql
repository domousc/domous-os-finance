-- Adicionar campo scheduled_payment_date às comissões
ALTER TABLE public.partner_commissions 
ADD COLUMN IF NOT EXISTS scheduled_payment_date DATE;

-- Criar função para calcular data de pagamento (dia 10 do mês seguinte)
CREATE OR REPLACE FUNCTION public.calculate_commission_payment_date(ref_month DATE)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $$
  SELECT (DATE_TRUNC('month', ref_month) + INTERVAL '1 month' + INTERVAL '9 days')::DATE;
$$;

-- Atualizar comissões existentes com a data calculada
UPDATE public.partner_commissions
SET scheduled_payment_date = calculate_commission_payment_date(reference_month)
WHERE scheduled_payment_date IS NULL;

-- Criar trigger para calcular automaticamente a data em novos registros
CREATE OR REPLACE FUNCTION public.set_commission_payment_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.scheduled_payment_date IS NULL THEN
    NEW.scheduled_payment_date := calculate_commission_payment_date(NEW.reference_month);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_commission_payment_date_trigger ON public.partner_commissions;

CREATE TRIGGER set_commission_payment_date_trigger
BEFORE INSERT OR UPDATE ON public.partner_commissions
FOR EACH ROW
EXECUTE FUNCTION public.set_commission_payment_date();