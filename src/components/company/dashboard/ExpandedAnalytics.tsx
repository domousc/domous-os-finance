import { RevenueGrowthChart } from "./charts/RevenueGrowthChart";
import { FinancialBreakdownChart } from "./charts/FinancialBreakdownChart";
import { CashFlowChart } from "./charts/CashFlowChart";
import { KPICards } from "./KPICards";

export const ExpandedAnalytics = () => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <KPICards />
      
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueGrowthChart monthsToShow={6} />
        <CashFlowChart monthsToShow={6} />
      </div>

      <FinancialBreakdownChart monthsToShow={6} />
    </div>
  );
};
