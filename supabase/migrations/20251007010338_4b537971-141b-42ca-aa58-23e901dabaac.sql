-- Function to generate commissions for existing invoices when creating a new agreement
CREATE OR REPLACE FUNCTION public.generate_commissions_for_agreement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_record RECORD;
  commission_amount NUMERIC;
  partner_name TEXT;
BEGIN
  -- Get partner name
  SELECT name INTO partner_name
  FROM public.partners
  WHERE id = NEW.partner_id;
  
  -- Only process if agreement is active
  IF NEW.status = 'active' THEN
    -- Find all pending and future invoices for this client
    FOR invoice_record IN
      SELECT *
      FROM public.invoices
      WHERE client_id = NEW.client_id
        AND company_id = NEW.company_id
        AND status IN ('pending', 'overdue')
        AND due_date >= NEW.start_date
        AND (NEW.end_date IS NULL OR due_date <= NEW.end_date)
        -- Don't create duplicate commissions
        AND NOT EXISTS (
          SELECT 1 
          FROM public.partner_commissions pc
          WHERE pc.client_invoice_id = invoices.id
            AND pc.partner_id = NEW.partner_id
        )
    LOOP
      -- Calculate commission amount
      commission_amount := invoice_record.amount * NEW.commission_percentage / 100;
      
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
        NEW.partner_id,
        NEW.client_id,
        NEW.id,
        invoice_record.id,
        NEW.commission_percentage,
        invoice_record.amount,
        commission_amount,
        DATE_TRUNC('month', invoice_record.due_date)::DATE,
        'pending',
        'Comissão automática - Parceiro: ' || partner_name || ' | Fatura: ' || invoice_record.invoice_number
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to generate commissions when an agreement is created
CREATE TRIGGER generate_commissions_on_agreement_insert
  AFTER INSERT ON public.partner_client_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_commissions_for_agreement();