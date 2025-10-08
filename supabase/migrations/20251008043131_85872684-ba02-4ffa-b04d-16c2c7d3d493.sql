-- Fase 1: Criar tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL UNIQUE,
  default_payment_day integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT default_payment_day_range CHECK (default_payment_day >= 1 AND default_payment_day <= 31)
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company settings"
  ON public.company_settings
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin can manage company settings"
  ON public.company_settings
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Superadmin full access company_settings"
  ON public.company_settings
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 2: Adicionar coluna payment_day na tabela team_members
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS payment_day integer,
ADD CONSTRAINT payment_day_range CHECK (payment_day IS NULL OR (payment_day >= 1 AND payment_day <= 31));

-- Fase 3: Atualizar função de geração de salários para usar dias de pagamento
CREATE OR REPLACE FUNCTION public.generate_monthly_salaries(ref_month date DEFAULT (date_trunc('month'::text, now()))::date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_record RECORD;
  generated_count INTEGER := 0;
  company_default_day INTEGER;
  payment_day INTEGER;
  payment_date DATE;
BEGIN
  FOR member_record IN
    SELECT * FROM public.team_members
    WHERE employment_type = 'fixed'
      AND status = 'active'
      AND monthly_salary IS NOT NULL
      AND monthly_salary > 0
  LOOP
    -- Check if payment already exists for this member and month
    IF NOT EXISTS (
      SELECT 1 FROM public.team_payments
      WHERE team_member_id = member_record.id
        AND reference_month = ref_month
        AND payment_type = 'salary'
    ) THEN
      -- Get company default payment day
      SELECT default_payment_day INTO company_default_day
      FROM public.company_settings
      WHERE company_id = member_record.company_id
      LIMIT 1;
      
      -- Use member's payment_day if set, otherwise use company default (or 10 as fallback)
      payment_day := COALESCE(member_record.payment_day, company_default_day, 10);
      
      -- Calculate payment date (next month + payment_day)
      payment_date := (ref_month + INTERVAL '1 month')::date;
      payment_date := payment_date + (payment_day - 1);
      
      INSERT INTO public.team_payments (
        company_id,
        team_member_id,
        payment_type,
        description,
        amount,
        salary_snapshot,
        reference_month,
        due_date,
        status
      ) VALUES (
        member_record.company_id,
        member_record.id,
        'salary',
        'Salário - ' || member_record.name || ' (' || TO_CHAR(ref_month, 'MM/YYYY') || ')',
        member_record.monthly_salary,
        member_record.monthly_salary,
        ref_month,
        payment_date::TIMESTAMP WITH TIME ZONE,
        'pending'
      );
      
      generated_count := generated_count + 1;
    END IF;
  END LOOP;
  
  RETURN generated_count;
END;
$function$;