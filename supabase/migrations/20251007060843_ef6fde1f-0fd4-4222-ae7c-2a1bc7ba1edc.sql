-- Add installment fields to company_expenses table
ALTER TABLE public.company_expenses
ADD COLUMN installment_group_id UUID,
ADD COLUMN total_installments INTEGER DEFAULT 1,
ADD COLUMN current_installment INTEGER DEFAULT 1,
ADD COLUMN total_amount NUMERIC;

-- Create index for better performance when querying installments
CREATE INDEX idx_company_expenses_installment_group 
ON public.company_expenses(installment_group_id) 
WHERE installment_group_id IS NOT NULL;

-- Update existing records to have default installment values
UPDATE public.company_expenses
SET 
  total_installments = 1,
  current_installment = 1,
  total_amount = amount
WHERE total_installments IS NULL;