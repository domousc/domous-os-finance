-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Deletar qualquer usuário antigo com esse email
DELETE FROM auth.users WHERE email = 'fabiozesk@gmail.com';