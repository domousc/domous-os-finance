-- Create partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  cnpj TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  pix_key TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access partners"
  ON public.partners FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admin can manage company partners"
  ON public.partners FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view company partners"
  ON public.partners FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- Create partner_client_agreements table
CREATE TABLE public.partner_client_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  commission_percentage NUMERIC NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id, client_id, company_id)
);

-- RLS Policies for partner_client_agreements
ALTER TABLE public.partner_client_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access agreements"
  ON public.partner_client_agreements FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admin can manage company agreements"
  ON public.partner_client_agreements FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view company agreements"
  ON public.partner_client_agreements FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- Create partner_commissions table
CREATE TABLE public.partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES public.partner_client_agreements(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  commission_percentage NUMERIC NOT NULL,
  base_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  reference_month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_date TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for partner_commissions
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access partner_commissions"
  ON public.partner_commissions FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admin can manage company partner commissions"
  ON public.partner_commissions FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view company partner commissions"
  ON public.partner_commissions FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- Function to generate partner commissions automatically
CREATE OR REPLACE FUNCTION public.generate_partner_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agreement_record RECORD;
  commission_amount NUMERIC;
BEGIN
  -- Find active agreements for this client
  FOR agreement_record IN
    SELECT pca.*, p.name as partner_name
    FROM public.partner_client_agreements pca
    JOIN public.partners p ON p.id = pca.partner_id
    WHERE pca.client_id = NEW.client_id
      AND pca.status = 'active'
      AND pca.company_id = NEW.company_id
      AND (pca.end_date IS NULL OR pca.end_date >= NEW.due_date)
  LOOP
    -- Calculate commission amount
    commission_amount := NEW.amount * agreement_record.commission_percentage / 100;
    
    -- Insert partner commission
    INSERT INTO public.partner_commissions (
      company_id,
      partner_id,
      client_id,
      agreement_id,
      client_invoice_id,
      commission_percentage,
      base_amount,
      commission_amount,
      reference_month,
      status,
      notes
    ) VALUES (
      NEW.company_id,
      agreement_record.partner_id,
      NEW.client_id,
      agreement_record.id,
      NEW.id,
      agreement_record.commission_percentage,
      NEW.amount,
      commission_amount,
      DATE_TRUNC('month', NEW.due_date)::DATE,
      'pending',
      'Comissão automática - Parceiro: ' || agreement_record.partner_name || ' | Fatura: ' || NEW.invoice_number
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to generate partner commissions automatically when an invoice is created
CREATE TRIGGER generate_partner_commissions_on_invoice
  AFTER INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.client_id IS NOT NULL)
  EXECUTE FUNCTION public.generate_partner_commissions();

-- Add trigger for updated_at on partners
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on partner_client_agreements
CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON public.partner_client_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on partner_commissions
CREATE TRIGGER update_partner_commissions_updated_at
  BEFORE UPDATE ON public.partner_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();