import { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ExpensesHeader } from "@/components/company/expenses/ExpensesHeader";
import { ExpensesStats } from "@/components/company/expenses/ExpensesStats";
import { ExpensesTable } from "@/components/company/expenses/ExpensesTable";
import { ExpenseDialog } from "@/components/company/expenses/ExpenseDialog";
import { PeriodFilter, type Period } from "@/components/shared/PeriodFilter";
import { supabase } from "@/integrations/supabase/client";

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
        <ExpensesHeader onAddExpense={() => setDialogOpen(true)} />
        <PeriodFilter period={period} onPeriodChange={setPeriod} />
        <ExpensesStats period={period} />
        <ExpensesTable period={period} />
        <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </AppLayout>
  );
};

export default Expenses;
