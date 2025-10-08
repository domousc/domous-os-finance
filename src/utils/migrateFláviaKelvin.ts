import { supabase } from "@/integrations/supabase/client";

/**
 * Script de migração única para deletar despesas antigas de Flávia e Kelvin
 * que foram migradas para team_members
 * 
 * EXECUTAR APENAS UMA VEZ!
 */
export async function deleteOldExpenses() {
  const expenseIds = [
    'c9f06344-05bb-415b-8ddb-d2bb394c9661', // Flávia
    'ba2c26ee-3d26-45cf-b81b-9f4c03f7c575'  // Kelvin
  ];

  console.log('🗑️ Deletando despesas antigas de Flávia e Kelvin...');

  const { data, error } = await supabase
    .from('company_expenses')
    .delete()
    .in('id', expenseIds)
    .select();

  if (error) {
    console.error('❌ Erro ao deletar despesas:', error);
    throw error;
  }

  console.log('✅ Despesas deletadas com sucesso:', data);
  return data;
}

// Auto-executar quando importado
if (typeof window !== 'undefined') {
  console.log('⚠️ Script de migração carregado. Execute deleteOldExpenses() no console para deletar as despesas antigas.');
}
