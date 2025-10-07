import { useState, useEffect } from "react";
import { PersonalFinanceHeader } from "@/components/company/personal/PersonalFinanceHeader";
import { PersonalFinanceStats } from "@/components/company/personal/PersonalFinanceStats";
import { PersonalTransactionsTable } from "@/components/company/personal/PersonalTransactionsTable";
import { TransactionDialog } from "@/components/company/personal/TransactionDialog";
import { supabase } from "@/integrations/supabase/client";

const PersonalFinance = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

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
    <div className="space-y-6">
      <PersonalFinanceHeader onAddTransaction={() => setDialogOpen(true)} />
      <PersonalFinanceStats />
      <PersonalTransactionsTable />
      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default PersonalFinance;
