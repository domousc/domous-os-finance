import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { FinanceOverviewStats } from "@/components/company/finance/FinanceOverviewStats";
import { FinanceTimeline } from "@/components/company/finance/FinanceTimeline";
import { PeriodFilter, type Period } from "@/components/shared/PeriodFilter";

const FinanceOverview = () => {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Visão Geral Financeira"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visão Geral Financeira</h1>
            <p className="text-muted-foreground">
              Dashboard consolidado de todas as movimentações financeiras da empresa
            </p>
          </div>
          <PeriodFilter period={period} onPeriodChange={setPeriod} />
        </div>
        
        <FinanceOverviewStats period={period} />
        <FinanceTimeline period={period} />
      </div>
    </AppLayout>
  );
};

export default FinanceOverview;
