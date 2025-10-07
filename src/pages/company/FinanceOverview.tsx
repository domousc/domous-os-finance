import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { FinanceOverviewStats } from "@/components/company/finance/FinanceOverviewStats";
import { FinanceTimeline } from "@/components/company/finance/FinanceTimeline";

const FinanceOverview = () => {
  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Visão Geral Financeira"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral Financeira</h1>
          <p className="text-muted-foreground">
            Dashboard consolidado de todas as movimentações financeiras da empresa
          </p>
        </div>
        
        <FinanceOverviewStats />
        <FinanceTimeline />
      </div>
    </AppLayout>
  );
};

export default FinanceOverview;
