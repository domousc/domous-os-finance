# Convenções de Categorização de Dados

## 🧑‍💼 Pagamentos a Pessoas
**Use:** Página "Time" → Tabela `team_payments`
- Salários fixos
- Bonificações
- Comissões internas
- Qualquer pagamento recorrente a pessoas físicas

### Como cadastrar:
1. Acesse **Time** no menu lateral
2. Clique em **"Adicionar Membro"**
3. Preencha os dados da pessoa
4. Configure o tipo de emprego:
   - **Fixo**: Para salários mensais regulares
   - **Variável**: Para pagamentos sob demanda
5. Defina o salário mensal (se fixo)
6. Configure o dia de pagamento preferencial

---

## 🤝 Comissões de Parceiros
**Use:** Página "Parceiros" → Tabela `partner_commissions`
- Comissões de vendas
- Indicações
- Parcerias comerciais
- Acordos de repasse

### Como cadastrar:
1. Acesse **Parceiros** no menu lateral
2. Cadastre o parceiro
3. Crie um **Acordo** vinculando o parceiro ao cliente
4. As comissões serão geradas automaticamente quando as faturas forem pagas

---

## 💼 Despesas Operacionais
**Use:** Página "Despesas" → Tabela `company_expenses`
- Assinaturas de software (AWS, Notion, Figma, etc.)
- Aluguel de escritório ou espaços
- Internet e telefonia
- Material de escritório
- Serviços terceirizados de **empresas** (não pessoas físicas)
- Energia elétrica, água, gás
- Marketing e publicidade (Google Ads, Meta Ads)
- Manutenção e reparos

### Tipos de despesas:
- **Assinatura**: Pagamentos recorrentes mensais/anuais
- **Serviço**: Serviços contratados
- **Infraestrutura**: Custos de infraestrutura e TI
- **Outros**: Despesas diversas
- **Pontual**: Pagamento único, não recorrente

### Ciclos de cobrança:
- **Mensal**: Cobra todo mês
- **Anual**: Cobra uma vez por ano
- **Única**: Pagamento único

---

## ❌ NÃO FAZER

### ❌ **NUNCA** cadastre nomes de pessoas em "Despesas Operacionais"
**Errado:**
```
Item: Flávia
Tipo: Outros
Valor: R$ 1.800,00
```

**Correto:**
```
Vá em Time → Adicionar Membro
Nome: Flávia
Tipo: Fixo
Salário: R$ 1.800,00
```

### ❌ **NUNCA** misture tipos de pagamento
- Não cadastre salários como despesas
- Não cadastre comissões de parceiros como despesas
- Não cadastre pagamentos de PJ como "Time" (use Parceiros)

### ❌ **NUNCA** use categorias inadequadas
- Software/SaaS → Tipo "Assinatura"
- Pessoa física → Use "Time"
- Parceiro comercial → Use "Parceiros"
- Fornecedor PJ → Use "Despesas" tipo "Serviço"

---

## ✅ Exemplos Práticos

### Exemplo 1: Novo funcionário
**Situação:** Contratar Maria como assistente administrativa com salário de R$ 2.500/mês

**Ação correta:**
1. Time → Adicionar Membro
2. Nome: Maria Silva
3. Cargo: Assistente Administrativa
4. Tipo: Fixo
5. Salário: R$ 2.500,00
6. Dia de pagamento: 5

### Exemplo 2: Parceiro de vendas
**Situação:** João indica clientes e recebe 10% de comissão

**Ação correta:**
1. Parceiros → Adicionar Parceiro
2. Nome: João Vendas
3. Criar Acordo com cliente
4. Porcentagem: 10%
5. As comissões serão geradas automaticamente

### Exemplo 3: Software
**Situação:** Assinatura do Notion (R$ 79/mês)

**Ação correta:**
1. Despesas → Adicionar Despesa
2. Item: Notion Workspace
3. Tipo: Assinatura
4. Ciclo: Mensal
5. Valor: R$ 79,00

### Exemplo 4: Serviço de limpeza
**Situação:** Empresa de limpeza (CNPJ) cobra R$ 300/mês

**Ação correta:**
1. Despesas → Adicionar Despesa
2. Item: Limpeza Escritório - Empresa XYZ
3. Tipo: Serviço
4. Ciclo: Mensal
5. Valor: R$ 300,00

---

## 🔍 Dúvidas Comuns

**Q: Como diferenciar pessoa física de pessoa jurídica?**
- **Pessoa física (CPF)** → Use "Time"
- **Pessoa jurídica (CNPJ)** → Use "Despesas" ou "Parceiros" dependendo do tipo de relação

**Q: E se o parceiro for pessoa física?**
- Use "Parceiros" mesmo assim, pois o importante é o tipo de relação comercial

**Q: Freelancer eventual, onde cadastro?**
- Se for **recorrente**: Time (tipo Variável)
- Se for **pontual**: Despesas (tipo Pontual)

**Q: Consultoria especializada?**
- Se for **pessoa física**: Time ou Despesas dependendo da recorrência
- Se for **empresa**: Despesas tipo "Serviço"

---

## 📊 Relatórios e Visualizações

### Dashboard "À Pagar"
Mostra consolidado de:
- **Total a Pagar**: Soma de tudo
- **Comissões**: Comissões de parceiros pendentes
- **Despesas**: Despesas operacionais pendentes
- **Equipe**: Pagamentos de equipe pendentes

### Visão "Por Pessoa"
Agrupa pagamentos por pessoa (Time + Parceiros)
- Facilita pagamentos em lote
- Mostra histórico completo por pessoa

### Visão "Por Item"
Lista todos os itens pendentes individualmente
- Despesas operacionais
- Comissões de parceiros
- Pagamentos de equipe

---

## 🎯 Melhores Práticas

1. ✅ Sempre use a categoria correta desde o início
2. ✅ Configure tipos de emprego adequadamente (Fixo vs Variável)
3. ✅ Use descrições claras e específicas
4. ✅ Defina datas de vencimento realistas
5. ✅ Revise e categorize mensalmente
6. ✅ Mantenha dados de contato atualizados (PIX, banco)
7. ✅ Use observações para informações adicionais importantes

---

**Última atualização:** 07/10/2025
**Versão:** 1.0
