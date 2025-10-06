import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { ReportsHeader } from "@/components/superadmin/reports/ReportsHeader";
import { PeriodFilter } from "@/components/superadmin/reports/PeriodFilter";
import { StatCard } from "@/components/superadmin/reports/StatCard";
import { SubscriptionsChart } from "@/components/superadmin/reports/SubscriptionsChart";
import { CompaniesChart } from "@/components/superadmin/reports/CompaniesChart";
import { RevenueChart } from "@/components/superadmin/reports/RevenueChart";
import { UsersChart } from "@/components/superadmin/reports/UsersChart";
import { LoadingScreen } from "@/components/LoadingScreen";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, DollarSign, TrendingUp } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "1y";

const Reports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    companiesGrowth: 0,
    usersGrowth: 0,
    subscriptionsGrowth: 0,
    revenueGrowth: 0,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isSuperAdmin) {
        navigate("/dashboard");
      }
    }
  }, [user, isSuperAdmin, authLoading, roleLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // Buscar dados
      const [companiesRes, usersRes, subscriptionsRes] = await Promise.all([
        supabase.from("companies").select("created_at"),
        supabase.from("profiles").select("created_at"),
        supabase.from("subscriptions").select("status, created_at, plans(price)"),
      ]);

      const companies = companiesRes.data || [];
      const users = usersRes.data || [];
      const subscriptions = subscriptionsRes.data || [];

      // Calcular totais
      const totalCompanies = companies.length;
      const totalUsers = users.length;
      const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length;
      const totalRevenue = subscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + (Number(s.plans?.price) || 0), 0);

      // Calcular crescimento comparando com período anterior
      const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
      
      const companiesInPeriod = companies.filter(
        (c) => new Date(c.created_at) >= startDate
      ).length;
      const companiesInPrevPeriod = companies.filter(
        (c) =>
          new Date(c.created_at) >= prevStartDate &&
          new Date(c.created_at) < startDate
      ).length;

      const usersInPeriod = users.filter(
        (u) => new Date(u.created_at) >= startDate
      ).length;
      const usersInPrevPeriod = users.filter(
        (u) =>
          new Date(u.created_at) >= prevStartDate &&
          new Date(u.created_at) < startDate
      ).length;

      const subscriptionsInPeriod = subscriptions.filter(
        (s) => new Date(s.created_at) >= startDate
      ).length;
      const subscriptionsInPrevPeriod = subscriptions.filter(
        (s) =>
          new Date(s.created_at) >= prevStartDate &&
          new Date(s.created_at) < startDate
      ).length;

      setStats({
        totalCompanies,
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        companiesGrowth:
          companiesInPrevPeriod > 0
            ? ((companiesInPeriod - companiesInPrevPeriod) / companiesInPrevPeriod) * 100
            : companiesInPeriod > 0
            ? 100
            : 0,
        usersGrowth:
          usersInPrevPeriod > 0
            ? ((usersInPeriod - usersInPrevPeriod) / usersInPrevPeriod) * 100
            : usersInPeriod > 0
            ? 100
            : 0,
        subscriptionsGrowth:
          subscriptionsInPrevPeriod > 0
            ? ((subscriptionsInPeriod - subscriptionsInPrevPeriod) / subscriptionsInPrevPeriod) *
              100
            : subscriptionsInPeriod > 0
            ? 100
            : 0,
        revenueGrowth: 0, // Simplified for now
      });
    };

    if (isSuperAdmin) {
      fetchStats();
    }
  }, [period, isSuperAdmin]);

  if (authLoading || roleLoading) {
    return <LoadingScreen message="Carregando relatórios" />;
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        <ReportsHeader />
        
        <PeriodFilter period={period} onPeriodChange={setPeriod} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Empresas"
            value={stats.totalCompanies}
            growth={stats.companiesGrowth}
            icon={Building2}
            color="blue"
            delay={0}
          />
          <StatCard
            title="Usuários"
            value={stats.totalUsers}
            growth={stats.usersGrowth}
            icon={Users}
            color="green"
            delay={100}
          />
          <StatCard
            title="Assinaturas Ativas"
            value={stats.activeSubscriptions}
            growth={stats.subscriptionsGrowth}
            icon={TrendingUp}
            color="purple"
            delay={200}
          />
          <StatCard
            title="Receita Total"
            value={stats.totalRevenue}
            growth={stats.revenueGrowth}
            icon={DollarSign}
            color="orange"
            isCurrency
            delay={300}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubscriptionsChart period={period} />
          <CompaniesChart period={period} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart period={period} />
          <UsersChart period={period} />
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Reports;
