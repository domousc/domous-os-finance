import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsSkeleton } from "@/components/shared/StatsSkeleton";
import { DollarSign, AlertCircle, Calendar, RefreshCw } from "lucide-react";
import type { Period } from "@/components/shared/PeriodFilter";
import { calculateDateRange, calculateComparisonRange, countRecurrenceInPeriod, formatComparison } from "@/lib/dateFilters";

interface ExpensesStatsProps {
  period: Period;
}

export function ExpensesStats({ period }: ExpensesStatsProps) {
  const { user } = useAuth();
  const dateRange = calculateDateRange(period);
  const comparisonRange = calculateComparisonRange(period);

  const { data: currentStats, isLoading } = useQuery({
    queryKey: ["expenses-stats", user?.id, period],
    queryFn: async () => {
      let query = supabase
        .from("company_expenses")
        .select("status, amount, billing_cycle, due_date, type");

      if (dateRange.start && dateRange.end) {
        query = query
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const { data: expenses, error } = await query;
      if (error) throw error;

      const totalPending = expenses
        .filter((e) => e.status === "pending")
        .reduce((sum, e) => {
          const count = countRecurrenceInPeriod(e.billing_cycle, dateRange.start, dateRange.end);
          return sum + Number(e.amount) * count;
        }, 0);

      const totalOverdue = expenses
        .filter((e) => e.status === "overdue")
        .reduce((sum, e) => {
          const count = countRecurrenceInPeriod(e.billing_cycle, dateRange.start, dateRange.end);
          return sum + Number(e.amount) * count;
        }, 0);

      const monthlyRecurring = expenses
        .filter((e) => e.billing_cycle === "monthly" && e.status !== "paid" && e.status !== "cancelled")
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const activeSubscriptions = expenses
        .filter(
          (e) =>
            (e.billing_cycle === "monthly" || e.billing_cycle === "annual") &&
            e.status !== "paid" &&
            e.status !== "cancelled"
        )
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        totalPending,
        totalOverdue,
        monthlyRecurring,
        activeSubscriptions,
      };
    },
    enabled: !!user,
  });

  const { data: previousStats } = useQuery({
    queryKey: ["expenses-stats-comparison", user?.id, period],
    queryFn: async () => {
      if (!comparisonRange.start || !comparisonRange.end) return null;

      const { data: expenses, error } = await supabase
        .from("company_expenses")
        .select("status, amount, billing_cycle, due_date")
        .gte("due_date", comparisonRange.start.toISOString())
        .lte("due_date", comparisonRange.end.toISOString());

      if (error) throw error;

      const totalPending = expenses
        .filter((e) => e.status === "pending")
        .reduce((sum, e) => {
          const count = countRecurrenceInPeriod(e.billing_cycle, comparisonRange.start, comparisonRange.end);
          return sum + Number(e.amount) * count;
        }, 0);

      const totalOverdue = expenses
        .filter((e) => e.status === "overdue")
        .reduce((sum, e) => {
          const count = countRecurrenceInPeriod(e.billing_cycle, comparisonRange.start, comparisonRange.end);
          return sum + Number(e.amount) * count;
        }, 0);

      return { totalPending, totalOverdue };
    },
    enabled: !!user && !!comparisonRange.start,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const pendingComparison = formatComparison(
    currentStats?.totalPending || 0,
    previousStats?.totalPending || 0,
    true
  );

  const overdueComparison = formatComparison(
    currentStats?.totalOverdue || 0,
    previousStats?.totalOverdue || 0,
    true
  );

  if (isLoading) {
    return <StatsSkeleton count={4} />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3">
          <CardTitle className="text-xs font-medium">Total Pendente</CardTitle>
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold">
            {formatCurrency(currentStats?.totalPending || 0)}
          </div>
          <p className={`text-[10px] ${pendingComparison.color} mt-0.5`}>
            {pendingComparison.text}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3">
          <CardTitle className="text-xs font-medium">Em Atraso</CardTitle>
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold">
            {formatCurrency(currentStats?.totalOverdue || 0)}
          </div>
          <p className={`text-[10px] ${overdueComparison.color} mt-0.5`}>
            {overdueComparison.text}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3">
          <CardTitle className="text-xs font-medium">Recorrência Mensal</CardTitle>
          <Calendar className="h-3.5 w-3.5 text-blue-500" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold">
            {formatCurrency(currentStats?.monthlyRecurring || 0)}
          </div>
          <p className="text-[10px] text-muted-foreground">Valor fixo mensal</p>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3">
          <CardTitle className="text-xs font-medium">Assinaturas Ativas</CardTitle>
          <RefreshCw className="h-3.5 w-3.5 text-purple-500" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-xl font-bold">
            {formatCurrency(currentStats?.activeSubscriptions || 0)}
          </div>
          <p className="text-[10px] text-muted-foreground">Total recorrente</p>
        </CardContent>
      </Card>
    </div>
  );
}