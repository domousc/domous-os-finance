import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { FinanceOverviewStats } from "@/components/company/finance/FinanceOverviewStats";
import { FinanceTimeline } from "@/components/company/finance/FinanceTimeline";
import { PeriodFilter, type Period, type CustomDateRange } from "@/components/shared/PeriodFilter";
import { TaxCalculation } from "@/components/company/finance/TaxCalculation";

const FinanceOverview = () => {
  const [period, setPeriod] = useState<Period>("1m");
  const [customRange, setCustomRange] = useState<CustomDateRange>();

  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Financeiro"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">
              Visão geral do recebimento e cálculo automático de impostos
            </p>
          </div>
          <PeriodFilter 
            period={period} 
            onPeriodChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>
        
        <FinanceOverviewStats period={period} customRange={customRange} />
        <TaxCalculation period={period} customRange={customRange} />
        <FinanceTimeline period={period} />
      </div>
    </AppLayout>
  );
};

export default FinanceOverview;
