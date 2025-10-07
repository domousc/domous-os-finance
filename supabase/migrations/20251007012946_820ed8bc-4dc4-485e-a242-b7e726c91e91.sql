-- Create function to handle commission generation when invoice is paid
CREATE OR REPLACE FUNCTION public.update_partner_commission_on_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  agreement_record RECORD;
  commission_amount NUMERIC;
  partner_name TEXT;
  existing_commission_id UUID;
BEGIN
  -- Only process if invoice status changed to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    -- Find active agreements for this client
    FOR agreement_record IN
      SELECT pca.*, p.name as partner_name
      FROM public.partner_client_agreements pca
      JOIN public.partners p ON p.id = pca.partner_id
      WHERE pca.client_id = NEW.client_id
        AND pca.status = 'active'
        AND pca.company_id = NEW.company_id
        AND (pca.end_date IS NULL OR pca.end_date >= NEW.due_date)
        AND pca.start_date <= NEW.due_date
    LOOP
      -- Calculate commission amount
      commission_amount := NEW.amount * agreement_record.commission_percentage / 100;
      
      -- Check if commission already exists for this invoice
      SELECT id INTO existing_commission_id
      FROM public.partner_commissions
      WHERE client_invoice_id = NEW.id
        AND partner_id = agreement_record.partner_id
      LIMIT 1;
      
      IF existing_commission_id IS NOT NULL THEN
        -- Update existing commission
        UPDATE public.partner_commissions
        SET 
          base_amount = NEW.amount,
          commission_amount = commission_amount,
          commission_percentage = agreement_record.commission_percentage,
          updated_at = now()
        WHERE id = existing_commission_id;
      ELSE
        -- Insert new partner commission
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
          DATE_TRUNC('month', NEW.paid_date)::DATE,
          'pending',
          'Comissão gerada automaticamente - Parceiro: ' || agreement_record.partner_name || ' | Fatura: ' || NEW.invoice_number || ' paga em ' || TO_CHAR(NEW.paid_date, 'DD/MM/YYYY')
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for invoice payment
DROP TRIGGER IF EXISTS update_commission_on_invoice_paid ON public.invoices;
CREATE TRIGGER update_commission_on_invoice_paid
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partner_commission_on_invoice_paid();