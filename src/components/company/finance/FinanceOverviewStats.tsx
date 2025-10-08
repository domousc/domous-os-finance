import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, Activity } from "lucide-react";
import type { Period } from "@/components/shared/PeriodFilter";
import { calculateFutureDateRange, calculateComparisonRange, countRecurrenceInPeriod, formatComparison } from "@/lib/dateFilters";

interface FinanceOverviewStatsProps {
  period: Period;
}

export function FinanceOverviewStats({ period }: FinanceOverviewStatsProps) {
  const { user } = useAuth();
  const dateRange = calculateFutureDateRange(period);
  const comparisonRange = calculateComparisonRange(period);
  const { data: currentStats } = useQuery({
    queryKey: ["finance-overview-stats", user?.id, period],
    queryFn: async () => {
      let invoicesQuery = supabase
        .from("invoices")
        .select("status, amount, due_date, paid_date");

      let commissionsQuery = supabase
        .from("partner_commissions")
        .select("status, commission_amount, scheduled_payment_date, reference_month");

      let expensesQuery = supabase
        .from("company_expenses")
        .select("status, amount, due_date, billing_cycle");

      if (dateRange.start && dateRange.end) {
        invoicesQuery = invoicesQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());

        commissionsQuery = commissionsQuery
          .gte("scheduled_payment_date", dateRange.start.toISOString())
          .lte("scheduled_payment_date", dateRange.end.toISOString());

        expensesQuery = expensesQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const [
        { data: invoices, error: invoicesError },
        { data: commissions, error: commissionsError },
        { data: expenses, error: expensesError },
      ] = await Promise.all([
        invoicesQuery,
        commissionsQuery,
        expensesQuery,
      ]);

      if (invoicesError) throw invoicesError;
      if (commissionsError) throw commissionsError;
      if (expensesError) throw expensesError;

      const receivable = (invoices || [])
        .filter((i) => i.status === "pending" || i.status === "overdue")
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const commissionsPayable = (commissions || [])
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const operational = (expenses || [])
        .filter((e) => e.status === "pending" || e.status === "overdue")
        .reduce((sum, e) => {
          const count = countRecurrenceInPeriod(e.billing_cycle, dateRange.start, dateRange.end);
          return sum + Number(e.amount) * count;
        }, 0);

      const payable = commissionsPayable + operational;

      const overdue = (invoices || [])
        .filter((i) => i.status === "overdue")
        .reduce((sum, i) => sum + Number(i.amount), 0) +
        (expenses || [])
          .filter((e) => e.status === "overdue")
          .reduce((sum, e) => {
            const count = countRecurrenceInPeriod(e.billing_cycle, dateRange.start, dateRange.end);
            return sum + Number(e.amount) * count;
          }, 0);

      const netProjected = receivable - payable;

      return {
        receivable,
        payable,
        operational,
        netProjected,
        overdue,
      };
    },
    enabled: !!user,
  });

  const { data: previousStats } = useQuery({
    queryKey: ["finance-overview-comparison", user?.id, period],
    queryFn: async () => {
      if (!comparisonRange.start || !comparisonRange.end) return null;

      const [
        { data: invoices, error: invoicesError },
        { data: commissions, error: commissionsError },
        { data: expenses, error: expensesError },
      ] = await Promise.all([
        supabase
          .from("invoices")
          .select("status, amount, due_date")
          .gte("due_date", comparisonRange.start.toISOString())
          .lte("due_date", comparisonRange.end.toISOString()),
        supabase
          .from("partner_commissions")
          .select("status, commission_amount, scheduled_payment_date")
          .gte("scheduled_payment_date", comparisonRange.start.toISOString())
          .lte("scheduled_payment_date", comparisonRange.end.toISOString()),
        supabase
          .from("company_expenses")
          .select("status, amount, due_date, billing_cycle")
          .gte("due_date", comparisonRange.start.toISOString())
          .lte("due_date", comparisonRange.end.toISOString()),
      ]);

      if (invoicesError) throw invoicesError;
      if (commissionsError) throw commissionsError;
      if (expensesError) throw expensesError;

      const receivable = (invoices || [])
        .filter((i) => i.status === "pending" || i.status === "overdue")
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const commissionsPayable = (commissions || [])
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const operational = (expenses || [])
        .filter((e) => e.status === "pending" || e.status === "overdue")
        .reduce((sum, e) => {
          const count = countRecurrenceInPeriod(e.billing_cycle, comparisonRange.start, comparisonRange.end);
          return sum + Number(e.amount) * count;
        }, 0);

      const payable = commissionsPayable + operational;
      const netProjected = receivable - payable;

      const overdue = (invoices || [])
        .filter((i) => i.status === "overdue")
        .reduce((sum, i) => sum + Number(i.amount), 0) +
        (expenses || [])
          .filter((e) => e.status === "overdue")
          .reduce((sum, e) => {
            const count = countRecurrenceInPeriod(e.billing_cycle, comparisonRange.start, comparisonRange.end);
            return sum + Number(e.amount) * count;
          }, 0);

      return { receivable, payable, operational, netProjected, overdue };
    },
    enabled: !!user && !!comparisonRange.start,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const receivableComparison = formatComparison(
    currentStats?.receivable || 0,
    previousStats?.receivable || 0,
    false
  );

  const payableComparison = formatComparison(
    currentStats?.payable || 0,
    previousStats?.payable || 0,
    true
  );

  const operationalComparison = formatComparison(
    currentStats?.operational || 0,
    previousStats?.operational || 0,
    true
  );

  const netComparison = formatComparison(
    currentStats?.netProjected || 0,
    previousStats?.netProjected || 0,
    false
  );

  const overdueComparison = formatComparison(
    currentStats?.overdue || 0,
    previousStats?.overdue || 0,
    true
  );

  const netProjectedColor = (currentStats?.netProjected || 0) >= 0 ? "text-green-600" : "text-destructive";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A Receber</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(currentStats?.receivable || 0)}
          </div>
          {period !== "all" && (
            <p className={`text-xs ${receivableComparison.color} mt-1`}>
              {receivableComparison.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(currentStats?.payable || 0)}
          </div>
          {period !== "all" && (
            <p className={`text-xs ${payableComparison.color} mt-1`}>
              {payableComparison.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas Operacionais</CardTitle>
          <Activity className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(currentStats?.operational || 0)}
          </div>
          {period !== "all" && (
            <p className={`text-xs ${operationalComparison.color} mt-1`}>
              {operationalComparison.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
          <DollarSign className={`h-4 w-4 ${netProjectedColor}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netProjectedColor}`}>
            {formatCurrency(currentStats?.netProjected || 0)}
          </div>
          {period !== "all" && (
            <p className={`text-xs ${netComparison.color} mt-1`}>
              {netComparison.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(currentStats?.overdue || 0)}
          </div>
          {period !== "all" && (
            <p className={`text-xs ${overdueComparison.color} mt-1`}>
              {overdueComparison.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
