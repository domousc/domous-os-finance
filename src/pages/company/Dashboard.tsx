import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRole } from "@/contexts/RoleContext";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { FinanceOverviewStats } from "@/components/company/finance/FinanceOverviewStats";
import { ReceivablesList } from "@/components/company/dashboard/ReceivablesList";
import { PayablesList } from "@/components/company/dashboard/PayablesList";
import { QuickActions } from "@/components/company/dashboard/QuickActions";
import { PeriodFilter, type Period, type CustomDateRange } from "@/components/shared/PeriodFilter";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const { loading, hasActiveSubscription } = useSubscription();
  const [period, setPeriod] = useState<Period>("1m");
  const [customRange, setCustomRange] = useState<CustomDateRange>();

  // Superadmin deve ser redirecionado para o painel de superadmin
  useEffect(() => {
    if (!roleLoading && isSuperAdmin) {
      navigate("/superadmin", { replace: true });
    }
  }, [roleLoading, isSuperAdmin, navigate]);

  // Usuários normais sem assinatura ativa são redirecionados
  useEffect(() => {
    if (!roleLoading && !isSuperAdmin && !loading && !hasActiveSubscription) {
      navigate("/dashboard/subscription-expired");
    }
  }, [roleLoading, isSuperAdmin, loading, hasActiveSubscription, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSuperAdmin || !hasActiveSubscription) {
    return null;
  }

  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Dashboard"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs items={[{ label: "Dashboard" }]} />
            <h1 className="text-2xl font-bold mt-2">Dashboard Financeiro</h1>
            <p className="text-xs text-muted-foreground">
              Acompanhe suas métricas financeiras e gerencie seus recebimentos e pagamentos
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

        <div className="grid gap-4 lg:grid-cols-2">
          <ReceivablesList period={period} customRange={customRange} />
          <PayablesList period={period} customRange={customRange} />
        </div>

        <QuickActions />
      </div>
    </AppLayout>
  );
}
