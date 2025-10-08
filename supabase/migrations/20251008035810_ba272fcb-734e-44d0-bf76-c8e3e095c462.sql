-- Create enum for employment type
CREATE TYPE employment_type AS ENUM ('fixed', 'variable');

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  employment_type employment_type NOT NULL DEFAULT 'variable',
  monthly_salary NUMERIC,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  pix_key TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_payments table
CREATE TABLE public.team_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL DEFAULT 'salary',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference_month DATE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Users can view company team members"
  ON public.team_members FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin can manage company team members"
  ON public.team_members FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Superadmin full access team_members"
  ON public.team_members FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

-- RLS Policies for team_payments
CREATE POLICY "Users can view company team payments"
  ON public.team_payments FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin can manage company team payments"
  ON public.team_payments FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Superadmin full access team_payments"
  ON public.team_payments FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

-- Trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_payments_updated_at
  BEFORE UPDATE ON public.team_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate monthly salaries for fixed team members
CREATE OR REPLACE FUNCTION public.generate_monthly_salaries(
  ref_month DATE DEFAULT DATE_TRUNC('month', now())::DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        reference_month,
        due_date,
        status
      ) VALUES (
        member_record.company_id,
        member_record.id,
        'salary',
        'Salário - ' || member_record.name || ' (' || TO_CHAR(ref_month, 'MM/YYYY') || ')',
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
$$;