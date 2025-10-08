import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import type { Period } from "@/components/shared/PeriodFilter";
import { calculateFutureDateRange, calculateComparisonRange, countRecurrenceInPeriod, formatComparison } from "@/lib/dateFilters";

interface PayableStatsProps {
  period: Period;
}

export function PayableStats({ period }: PayableStatsProps) {
  const { user } = useAuth();
  const dateRange = calculateFutureDateRange(period);
  const comparisonRange = calculateComparisonRange(period);

  const { data: stats } = useQuery({
    queryKey: ["payable-stats", user?.id, period],
    queryFn: async () => {
      let commissionsQuery = supabase
        .from("partner_commissions")
        .select("status, commission_amount, scheduled_payment_date");

      let expensesQuery = supabase
        .from("company_expenses")
        .select("status, amount, due_date, billing_cycle");

      let teamPaymentsQuery = supabase
        .from("team_payments")
        .select("status, amount, due_date");

      if (dateRange.start && dateRange.end) {
        commissionsQuery = commissionsQuery
          .gte("scheduled_payment_date", dateRange.start.toISOString())
          .lte("scheduled_payment_date", dateRange.end.toISOString());

        expensesQuery = expensesQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());

        teamPaymentsQuery = teamPaymentsQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const { data: commissions, error: commissionsError } = await commissionsQuery;
      const { data: expenses, error: expensesError } = await expensesQuery;
      const { data: teamPayments, error: teamPaymentsError } = await teamPaymentsQuery;

      if (commissionsError) throw commissionsError;
      if (expensesError) throw expensesError;
      if (teamPaymentsError) throw teamPaymentsError;

      const commissionsPending = commissions
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const commissionsPaid = commissions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const expensesPending = expenses
        .filter((e) => e.status === "pending" || e.status === "overdue")
        .reduce((sum, e) => {
          const count = countRecurrenceInPeriod(e.billing_cycle, dateRange.start, dateRange.end);
          return sum + Number(e.amount) * count;
        }, 0);

      const teamPaymentsPending = (teamPayments || [])
        .filter((t) => t.status === "pending")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const today = new Date();
      const next30Days = new Date();
      next30Days.setDate(today.getDate() + 30);

      const dueNext30 = expenses
        .filter((e) => {
          const dueDate = new Date(e.due_date);
          return (
            (e.status === "pending" || e.status === "overdue") &&
            dueDate >= today &&
            dueDate <= next30Days
          );
        })
        .reduce((sum, e) => sum + Number(e.amount), 0) + 
        commissionsPending + 
        teamPaymentsPending;

      return {
        total: commissionsPending + expensesPending + teamPaymentsPending,
        commissionsPending,
        expensesPending,
        teamPaymentsPending,
        commissionsPaid,
        dueNext30,
        pendingCount: commissions.filter((c) => c.status === "pending").length,
        expensesCount: expenses.filter((e) => e.status === "pending" || e.status === "overdue").length,
        teamPaymentsCount: (teamPayments || []).filter((t) => t.status === "pending").length,
      };
    },
    enabled: !!user,
  });

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.total || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Comissões + despesas pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Comissões</CardTitle>
          <AlertCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.commissionsPending || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.pendingCount || 0} pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.expensesPending || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.expensesCount || 0} pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipe</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.teamPaymentsPending || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.teamPaymentsCount || 0} pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos 30 Dias</CardTitle>
          <XCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.dueNext30 || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Vencendo em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
