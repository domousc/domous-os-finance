-- Atualizar a função generate_monthly_salaries para usar o mês do pagamento como referência
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
  payment_month DATE;
BEGIN
  FOR member_record IN
    SELECT * FROM public.team_members
    WHERE employment_type = 'fixed'
      AND status = 'active'
      AND monthly_salary IS NOT NULL
      AND monthly_salary > 0
  LOOP
    -- Calculate payment date first (next month + payment_day)
    payment_date := (ref_month + INTERVAL '1 month')::date;
    
    -- Get company default payment day
    SELECT default_payment_day INTO company_default_day
    FROM public.company_settings
    WHERE company_id = member_record.company_id
    LIMIT 1;
    
    -- Use member's payment_day if set, otherwise use company default (or 10 as fallback)
    payment_day := COALESCE(member_record.payment_day, company_default_day, 10);
    payment_date := payment_date + (payment_day - 1);
    
    -- Extract the month from payment_date to use as reference_month
    payment_month := DATE_TRUNC('month', payment_date)::date;
    
    -- Check if payment already exists for this member and payment month
    IF NOT EXISTS (
      SELECT 1 FROM public.team_payments
      WHERE team_member_id = member_record.id
        AND reference_month = payment_month
        AND payment_type = 'salary'
    ) THEN
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
        'Salário - ' || member_record.name,
        member_record.monthly_salary,
        member_record.monthly_salary,
        payment_month,
        payment_date::TIMESTAMP WITH TIME ZONE,
        'pending'
      );
      
      generated_count := generated_count + 1;
    END IF;
  END LOOP;
  
  RETURN generated_count;
END;
$function$;