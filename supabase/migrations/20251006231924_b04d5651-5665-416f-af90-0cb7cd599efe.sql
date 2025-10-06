-- Criar enum para tipo de serviço
CREATE TYPE public.service_type AS ENUM ('subscription', 'one_time', 'recurring');

-- Criar enum para status do serviço
CREATE TYPE public.service_status AS ENUM ('active', 'inactive', 'archived');

-- Criar tabela de serviços
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  service_type service_type NOT NULL DEFAULT 'one_time',
  billing_cycle billing_period,
  payment_methods jsonb DEFAULT '[]'::jsonb,
  sku text,
  features jsonb DEFAULT '[]'::jsonb,
  status service_status NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Superadmin (acesso total)
CREATE POLICY "Superadmin full access services"
ON public.services
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Políticas RLS para Admin (acesso à própria empresa)
CREATE POLICY "Admin can view company services"
ON public.services
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can insert company services"
ON public.services
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update company services"
ON public.services
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete company services"
ON public.services
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Políticas RLS para usuários (apenas visualização da própria empresa)
CREATE POLICY "Users can view company services"
ON public.services
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_services_company_id ON public.services(company_id);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_service_type ON public.services(service_type);