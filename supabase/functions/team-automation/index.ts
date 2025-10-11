import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeamMember {
  id: string
  company_id: string
  name: string
  monthly_salary: number
  payment_day: number
  status: string
  employment_type: string
}

interface CompanySettings {
  company_id: string
  default_payment_day: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'all'

    let results = {
      salariesGenerated: 0,
      statusesUpdated: 0,
      errors: [] as string[],
    }

    // Ação 1: Gerar salários mensais
    if (action === 'all' || action === 'generate_salaries') {
      console.log('🔄 Iniciando geração de salários...')
      
      const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
      
      // Buscar todos os membros com salário fixo
      const { data: members, error: membersError } = await supabaseClient
        .from('team_members')
        .select('*, company_settings!inner(default_payment_day)')
        .eq('employment_type', 'fixed')
        .eq('status', 'active')
        .not('monthly_salary', 'is', null)
        .gt('monthly_salary', 0)

      if (membersError) {
        console.error('Erro ao buscar membros:', membersError)
        results.errors.push(`Membros: ${membersError.message}`)
      } else {
        console.log(`📋 Encontrados ${members?.length || 0} membros com salário fixo`)

        for (const member of members || []) {
          // Verificar se já existe pagamento para este mês
          const { data: existing } = await supabaseClient
            .from('team_payments')
            .select('id')
            .eq('team_member_id', member.id)
            .eq('reference_month', currentMonth)
            .eq('payment_type', 'salary')
            .single()

          if (existing) {
            console.log(`⏭️  Salário já existe para ${member.name}`)
            continue
          }

          // Calcular data de pagamento (próximo mês + dia de pagamento)
          const nextMonth = new Date(currentMonth)
          nextMonth.setMonth(nextMonth.getMonth() + 1)
          
          const paymentDay = member.payment_day || member.company_settings?.default_payment_day || 10
          const paymentDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), paymentDay)

          // Criar pagamento
          const { error: insertError } = await supabaseClient
            .from('team_payments')
            .insert({
              company_id: member.company_id,
              team_member_id: member.id,
              payment_type: 'salary',
              description: `Salário - ${member.name} (${new Date(currentMonth).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })})`,
              amount: member.monthly_salary,
              salary_snapshot: member.monthly_salary,
              reference_month: currentMonth,
              due_date: paymentDate.toISOString(),
              status: 'pending',
            })

          if (insertError) {
            console.error(`❌ Erro ao criar salário para ${member.name}:`, insertError)
            results.errors.push(`${member.name}: ${insertError.message}`)
          } else {
            console.log(`✅ Salário gerado para ${member.name}`)
            results.salariesGenerated++
          }
        }
      }
    }

    // Ação 2: Atualizar status de pagamentos atrasados
    if (action === 'all' || action === 'update_overdue') {
      console.log('🔄 Atualizando status de pagamentos atrasados...')
      
      const now = new Date().toISOString()
      
      // Atualizar team_payments
      const { error: teamError, count: teamCount } = await supabaseClient
        .from('team_payments')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', now)
        .is('paid_date', null)

      if (teamError) {
        console.error('Erro ao atualizar team_payments:', teamError)
        results.errors.push(`Team payments: ${teamError.message}`)
      } else {
        console.log(`✅ ${teamCount || 0} pagamentos de equipe marcados como atrasados`)
        results.statusesUpdated += teamCount || 0
      }

      // Atualizar partner_commissions
      const { error: partnerError, count: partnerCount } = await supabaseClient
        .from('partner_commissions')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('scheduled_payment_date', now)
        .is('paid_date', null)

      if (partnerError) {
        console.error('Erro ao atualizar partner_commissions:', partnerError)
        results.errors.push(`Partner commissions: ${partnerError.message}`)
      } else {
        console.log(`✅ ${partnerCount || 0} comissões marcadas como atrasadas`)
        results.statusesUpdated += partnerCount || 0
      }

      // Atualizar company_expenses
      const { error: expenseError, count: expenseCount } = await supabaseClient
        .from('company_expenses')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', now)
        .is('paid_date', null)

      if (expenseError) {
        console.error('Erro ao atualizar company_expenses:', expenseError)
        results.errors.push(`Expenses: ${expenseError.message}`)
      } else {
        console.log(`✅ ${expenseCount || 0} despesas marcadas como atrasadas`)
        results.statusesUpdated += expenseCount || 0
      }
    }

    console.log('📊 Resultado final:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
