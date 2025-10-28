import { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { PersonalFinanceHeader } from "@/components/company/personal/PersonalFinanceHeader";
import { PersonalFinanceStats } from "@/components/company/personal/PersonalFinanceStats";
import { PersonalTransactionsTable } from "@/components/company/personal/PersonalTransactionsTable";
import { TransactionDialog } from "@/components/company/personal/TransactionDialog";
import { PeriodFilter, type Period, type CustomDateRange } from "@/components/shared/PeriodFilter";
import { supabase } from "@/integrations/supabase/client";
import { PersonalIncomeChart } from "@/components/company/personal/PersonalIncomeChart";
import { PersonalExpenseChart } from "@/components/company/personal/PersonalExpenseChart";

const PersonalFinance = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("1m");
  const [customRange, setCustomRange] = useState<CustomDateRange>();

  useEffect(() => {
    const channel = supabase
      .channel("personal-transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "personal_transactions",
        },
        () => {
          // Realtime updates are handled by react-query invalidation
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
      headerBadge="Controle Pessoal"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PersonalFinanceHeader onAddTransaction={() => setDialogOpen(true)} />
          <PeriodFilter 
            period={period} 
            onPeriodChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>
        <PersonalFinanceStats period={period} customRange={customRange} />
        
        <div className="grid gap-4 lg:grid-cols-2">
          <PersonalIncomeChart />
          <PersonalExpenseChart />
        </div>

        <PersonalTransactionsTable period={period} customRange={customRange} />
        <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </AppLayout>
  );
};

export default PersonalFinance;
