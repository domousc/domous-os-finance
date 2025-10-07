import { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ExpensesHeader } from "@/components/company/expenses/ExpensesHeader";
import { ExpensesStats } from "@/components/company/expenses/ExpensesStats";
import { ExpensesTable } from "@/components/company/expenses/ExpensesTable";
import { ExpenseDialog } from "@/components/company/expenses/ExpenseDialog";
import { supabase } from "@/integrations/supabase/client";

const Expenses = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

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
        <ExpensesStats />
        <ExpensesTable />
        <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </AppLayout>
  );
};

export default Expenses;
