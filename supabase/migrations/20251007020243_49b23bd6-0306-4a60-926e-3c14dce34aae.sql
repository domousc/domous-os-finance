-- Criar enum para tipo de transação pessoal
CREATE TYPE transaction_type AS ENUM ('receivable', 'payable');

-- Criar enum para status de transação pessoal
CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Criar tabela de transações financeiras pessoais
CREATE TABLE public.personal_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  status transaction_status NOT NULL DEFAULT 'pending',
  category TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.personal_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Usuário pode visualizar apenas suas próprias transações
CREATE POLICY "Users can view own transactions"
ON public.personal_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Usuário pode criar transações para si mesmo
CREATE POLICY "Users can create own transactions"
ON public.personal_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Usuário pode atualizar apenas suas próprias transações
CREATE POLICY "Users can update own transactions"
ON public.personal_transactions
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Usuário pode deletar apenas suas próprias transações
CREATE POLICY "Users can delete own transactions"
ON public.personal_transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Função para atualizar status de transações atrasadas
CREATE OR REPLACE FUNCTION public.update_overdue_personal_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.personal_transactions
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < now()
    AND paid_date IS NULL;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_personal_transactions_updated_at
BEFORE UPDATE ON public.personal_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();