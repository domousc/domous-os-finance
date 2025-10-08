-- Add salary_snapshot to team_payments to preserve historical salary values
ALTER TABLE public.team_payments
ADD COLUMN salary_snapshot numeric;

-- Update existing salary payments to use their current amount as snapshot
UPDATE public.team_payments
SET salary_snapshot = amount
WHERE payment_type = 'salary';

-- Update generate_monthly_salaries function to use salary snapshot
CREATE OR REPLACE FUNCTION public.generate_monthly_salaries(ref_month date DEFAULT (date_trunc('month'::text, now()))::date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_record RECORD;
  generated_count INTEGER := 0;
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
        (ref_month + INTERVAL '1 month' + INTERVAL '4 days')::TIMESTAMP WITH TIME ZONE,
        'pending'
      );
      
      generated_count := generated_count + 1;
    END IF;
  END LOOP;
  
  RETURN generated_count;
END;
$function$;