import { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ExpensesStats } from "@/components/company/expenses/ExpensesStats";
import { ExpensesTable } from "@/components/company/expenses/ExpensesTable";
import { ExpenseDialog } from "@/components/company/expenses/ExpenseDialog";
import { PeriodFilter, type Period } from "@/components/shared/PeriodFilter";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
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
      <div className="space-y-4">
        <Breadcrumbs items={[
          { label: "Finanças", href: "/dashboard/finance" },
          { label: "Despesas Operacionais" }
        ]} />
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Despesas Operacionais</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gerencie assinaturas, serviços e infraestrutura
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <PeriodFilter period={period} onPeriodChange={setPeriod} />
              <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto h-9 text-sm">
                <Plus className="mr-2 h-3.5 w-3.5" />
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
