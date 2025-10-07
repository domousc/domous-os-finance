-- Create enum for expense types
CREATE TYPE public.expense_type AS ENUM (
  'subscription',
  'service',
  'infrastructure',
  'marketing',
  'team',
  'one_time'
);

-- Create enum for billing cycles
CREATE TYPE public.expense_billing_cycle AS ENUM (
  'monthly',
  'annual',
  'one_time'
);

-- Create company_expenses table
CREATE TABLE public.company_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  type public.expense_type NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  billing_cycle public.expense_billing_cycle NOT NULL DEFAULT 'one_time',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company expenses"
ON public.company_expenses
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin can manage company expenses"
ON public.company_expenses
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Superadmin full access company_expenses"
ON public.company_expenses
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_company_expenses_updated_at
BEFORE UPDATE ON public.company_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update overdue expenses
CREATE OR REPLACE FUNCTION public.update_overdue_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.company_expenses
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < now()
    AND paid_date IS NULL;
END;
$$;