import { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ExpensesStats } from "@/components/company/expenses/ExpensesStats";
import { ExpensesTable } from "@/components/company/expenses/ExpensesTable";
import { ExpenseDialog } from "@/components/company/expenses/ExpenseDialog";
import { PeriodFilter, type Period } from "@/components/shared/PeriodFilter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Expenses = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("1m");

  useEffect(() => {
    const channel = supabase
      .channel("company-expenses-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "company_expenses",
        },
        () => {
          // Realtime updates handled by react-query
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Despesas Operacionais"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Despesas Operacionais</h1>
              <p className="text-muted-foreground">
                Gerencie assinaturas, serviços, infraestrutura e outras despesas da empresa
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <PeriodFilter period={period} onPeriodChange={setPeriod} />
              <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </Button>
            </div>
          </div>
        </div>
        <ExpensesStats period={period} />
        <ExpensesTable period={period} />
        <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </AppLayout>
  );
};

export default Expenses;
