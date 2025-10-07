-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT, -- CPF/CNPJ
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_services table (service binding)
CREATE TABLE public.client_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  custom_price NUMERIC,
  cycles INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'canceled', 'overdue');

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  client_service_id UUID NOT NULL REFERENCES public.client_services(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  status invoice_status NOT NULL DEFAULT 'pending',
  cycle_number INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Admin can manage company clients"
ON public.clients
FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view company clients"
ON public.clients
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmin full access clients"
ON public.clients
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for client_services
CREATE POLICY "Admin can manage company client services"
ON public.client_services
FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view company client services"
ON public.client_services
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmin full access client_services"
ON public.client_services
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for invoices
CREATE POLICY "Admin can manage company invoices"
ON public.invoices
FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view company invoices"
ON public.invoices
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Superadmin full access invoices"
ON public.invoices
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_services_updated_at
BEFORE UPDATE ON public.client_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(company_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE company_id = company_uuid;
  
  invoice_num := 'INV-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_num;
END;
$$;

-- Function to generate invoices for a client service
CREATE OR REPLACE FUNCTION public.generate_invoices_for_service()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_record RECORD;
  invoice_amount NUMERIC;
  current_due_date TIMESTAMP WITH TIME ZONE;
  cycle_count INTEGER;
BEGIN
  -- Get service details
  SELECT * INTO service_record
  FROM public.services
  WHERE id = NEW.service_id;
  
  -- Determine invoice amount
  invoice_amount := COALESCE(NEW.custom_price, service_record.price);
  
  -- Determine first due date
  current_due_date := COALESCE(NEW.first_due_date, NEW.start_date);
  
  -- Generate invoices based on service type and cycles
  FOR cycle_count IN 1..NEW.cycles LOOP
    INSERT INTO public.invoices (
      company_id,
      client_id,
      client_service_id,
      service_id,
      invoice_number,
      amount,
      due_date,
      cycle_number,
      status
    ) VALUES (
      NEW.company_id,
      NEW.client_id,
      NEW.id,
      NEW.service_id,
      generate_invoice_number(NEW.company_id),
      invoice_amount,
      current_due_date,
      cycle_count,
      'pending'
    );
    
    -- Calculate next due date based on billing cycle
    IF service_record.billing_cycle = 'monthly' THEN
      current_due_date := current_due_date + INTERVAL '1 month';
      -- Adjust to last day of month if necessary
      IF EXTRACT(DAY FROM current_due_date) < EXTRACT(DAY FROM COALESCE(NEW.first_due_date, NEW.start_date)) THEN
        current_due_date := (DATE_TRUNC('month', current_due_date) + INTERVAL '1 month - 1 day')::TIMESTAMP WITH TIME ZONE;
      END IF;
    ELSIF service_record.billing_cycle = 'annual' THEN
      current_due_date := current_due_date + INTERVAL '1 year';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate invoices when service is linked
CREATE TRIGGER generate_invoices_on_service_link
AFTER INSERT ON public.client_services
FOR EACH ROW
EXECUTE FUNCTION public.generate_invoices_for_service();

-- Function to update invoice status to overdue
CREATE OR REPLACE FUNCTION public.update_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < now();
END;
$$;

-- Enable realtime for new tables
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;

ALTER TABLE public.client_services REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_services;

ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;