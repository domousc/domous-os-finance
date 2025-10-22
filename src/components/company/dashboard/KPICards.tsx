import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, Percent, Calendar } from "lucide-react";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export const KPICards = () => {
  const { user } = useAuth();

  const { data: kpis } = useQuery({
    queryKey: ["dashboard-kpis", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return null;

      const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      };

      const previousMonth = {
        start: startOfMonth(subMonths(new Date(), 1)),
        end: endOfMonth(subMonths(new Date(), 1)),
      };

      const [currentData, previousData] = await Promise.all([
        fetchMonthData(profile.company_id, currentMonth.start, currentMonth.end),
        fetchMonthData(profile.company_id, previousMonth.start, previousMonth.end),
      ]);

      const currentRevenue = currentData.paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
      const previousRevenue = previousData.paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const currentClients = new Set(currentData.invoices.map((i) => i.client_id)).size;
      const previousClients = new Set(previousData.invoices.map((i) => i.client_id)).size;
      const clientGrowth = previousClients > 0
        ? ((currentClients - previousClients) / previousClients) * 100
        : 0;

      const avgTicket = currentData.paidInvoices.length > 0
        ? currentRevenue / currentData.paidInvoices.length
        : 0;

      const recurringRevenue = currentData.invoices
        .filter((i) => i.client_service_id !== null)
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const totalExpenses = 
        currentData.commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0) +
        currentData.expenses.reduce((sum, e) => sum + Number(e.amount), 0) +
        currentData.teamPayments.reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        revenueGrowth,
        clientGrowth,
        avgTicket,
        recurringRevenue,
        totalExpenses,
        activeClients: currentClients,
      };
    },
    enabled: !!user,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium">Crescimento MoM</CardTitle>
          {(kpis?.revenueGrowth || 0) >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className={`text-lg font-bold ${(kpis?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            {formatPercent(kpis?.revenueGrowth || 0)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Receita vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium">Ticket Médio</CardTitle>
          <DollarSign className="h-3.5 w-3.5 text-blue-600" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-lg font-bold">
            {formatCurrency(kpis?.avgTicket || 0)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Valor médio por fatura
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium">Clientes Ativos</CardTitle>
          <Users className="h-3.5 w-3.5 text-purple-600" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-lg font-bold">
            {kpis?.activeClients || 0}
          </div>
          <p className={`text-[10px] mt-0.5 ${(kpis?.clientGrowth || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            {formatPercent(kpis?.clientGrowth || 0)} vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium">MRR</CardTitle>
          <Calendar className="h-3.5 w-3.5 text-orange-600" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-lg font-bold">
            {formatCurrency(kpis?.recurringRevenue || 0)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Receita recorrente mensal
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

async function fetchMonthData(companyId: string, start: Date, end: Date) {
  const [
    { data: invoices },
    { data: paidInvoices },
    { data: commissions },
    { data: expenses },
    { data: teamPayments },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, amount, client_id, client_service_id, status")
      .eq("company_id", companyId)
      .gte("due_date", start.toISOString())
      .lte("due_date", end.toISOString()),
    supabase
      .from("invoices")
      .select("amount")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("paid_date", start.toISOString())
      .lte("paid_date", end.toISOString()),
    supabase
      .from("partner_commissions")
      .select("commission_amount")
      .eq("company_id", companyId)
      .gte("scheduled_payment_date", start.toISOString())
      .lte("scheduled_payment_date", end.toISOString()),
    supabase
      .from("company_expenses")
      .select("amount")
      .eq("company_id", companyId)
      .gte("due_date", start.toISOString())
      .lte("due_date", end.toISOString()),
    supabase
      .from("team_payments")
      .select("amount")
      .eq("company_id", companyId)
      .gte("due_date", start.toISOString())
      .lte("due_date", end.toISOString()),
  ]);

  return {
    invoices: invoices || [],
    paidInvoices: paidInvoices || [],
    commissions: commissions || [],
    expenses: expenses || [],
    teamPayments: teamPayments || [],
  };
}
