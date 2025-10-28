# Fluxos de Cadastro Verificados

## ✅ Status dos Componentes

### 1. Clientes (`ClientDialog`)
- **Status**: ✅ VERIFICADO E CORRETO
- **Linha**: 138 - Filtra corretamente por `.eq("id", user?.id)`
- **Fluxo**: Busca company_id do perfil do usuário → Cria cliente com company_id

### 2. Serviços Vinculados

#### AddServiceDialog (Pacotes de Serviços)
- **Status**: ✅ CORRIGIDO
- **Problema**: Não estava filtrando por usuário ao buscar company_id
- **Correção**: Adicionado `.eq("id", user.id)` na linha 119
- **Fluxo**: 
  1. Autentica usuário
  2. Busca company_id do perfil
  3. Cria client_service com múltiplos serviços concatenados
  4. Gera faturas automaticamente via trigger

#### LinkServiceDialog (Serviço Individual)
- **Status**: ✅ VERIFICADO E CORRETO
- **Linha**: 106 - Filtra corretamente por `.eq("id", user?.id)`
- **Fluxo**: Similar ao AddServiceDialog mas para serviços únicos da tabela services

### 3. Despesas (`ExpenseDialog`)
- **Status**: ✅ VERIFICADO E CORRETO
- **Linha**: 139 - Filtra corretamente por `.eq("id", user?.id)`
- **Fluxo**: 
  1. Busca company_id
  2. Suporta parcelamento
  3. Sincroniza com tabela payables via trigger
  4. Define status baseado em tipo e data

### 4. Time

#### TeamMemberDialog
- **Status**: ✅ VERIFICADO E CORRETO
- **Linha**: 82 - Filtra corretamente por `.eq("id", user.id)`
- **Fluxo**: Cria membro do time com company_id correto

#### TeamPaymentDialog
- **Status**: ✅ VERIFICADO E CORRETO
- **Linha**: 96 - Filtra corretamente por `.eq("id", user.id)`
- **Fluxo**: 
  1. Busca membros ativos
  2. Gera descrição automática
  3. Cria pagamento com company_id

### 5. Comissões (`CommissionDialog`)
- **Status**: ✅ VERIFICADO E CORRETO
- **Linha**: 115 - Filtra corretamente por `.eq("id", user.id)`
- **Fluxo**: 
  1. Busca company_id
  2. Calcula comissão
  3. Vincula ao cliente correto

### 6. Controle Pessoal (`TransactionDialog`)
- **Status**: ✅ VERIFICADO E CORRETO
- **Usa**: `user_id` diretamente (não precisa de company_id)
- **Fluxo**: Vincula transação ao usuário autenticado

## 🔄 Triggers Ativos

### generate_invoices_for_service
- **Quando**: Após INSERT em client_services
- **O que faz**: Gera faturas automaticamente baseado em cycles e billing_cycle
- **Impacto**: Faturas aparecem automaticamente nos dashboards

### sync_company_expense_to_payables
- **Quando**: INSERT/UPDATE/DELETE em company_expenses
- **O que faz**: Sincroniza despesas com tabela payables
- **Impacto**: Despesas aparecem no dashboard de contas a pagar

### sync_partner_commission_to_payables
- **Quando**: INSERT/UPDATE/DELETE em partner_commissions
- **O que faz**: Sincroniza comissões com tabela payables
- **Impacto**: Comissões aparecem no dashboard de contas a pagar

## 📊 Dashboards Verificados

### Dashboard Principal
- **KPIs**: Busca dados de invoices, expenses, team_payments
- **Gráficos**: 
  - MonthlyRevenueChart: Últimos 6 meses de faturamento
  - FinancialSpreadsheet: Planilha com receitas, despesas, comissões
- **Listas**: ReceivablesList, PayablesList

### Clientes
- **Lista**: Mostra valor mensal, dia pagamento, mensalidades, total pago
- **Dados**: Busca client_services e calcula totais de invoices pagas

### Controle Pessoal
- **Gráficos**:
  - PersonalIncomeChart: Receitas mensais (receivable)
  - PersonalExpenseChart: Gastos mensais (payable)
- **Filtros**: Por período e tipo de transação

## ⚠️ Pontos de Atenção

1. **Autenticação**: Todos os componentes verificam se o usuário está autenticado antes de prosseguir
2. **Company ID**: Sempre buscar via profile do usuário autenticado
3. **Validações**: Formulários usam zod para validação
4. **Toast**: Feedback visual em todas as operações
5. **Realtime**: Canais Supabase atualizam listas automaticamente
6. **Parcelamento**: Suportado em despesas com installment_group_id

## 🐛 Erro Corrigido

**Erro**: "Empresa não encontrada" ao adicionar serviço
**Causa**: AddServiceDialog não filtrava profile por user.id
**Solução**: Adicionado filtro `.eq("id", user.id)` na query do profile
**Arquivo**: src/components/company/clients/profile/AddServiceDialog.tsx
**Linhas**: 113-121
