import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export function PayableStats() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["payable-stats", user?.id],
    queryFn: async () => {
      // Buscar comissões
      const { data: commissions, error: commissionsError } = await supabase
        .from("partner_commissions")
        .select("status, commission_amount");

      if (commissionsError) throw commissionsError;

      // Buscar despesas operacionais
      const { data: expenses, error: expensesError } = await supabase
        .from("company_expenses")
        .select("status, amount, due_date");

      if (expensesError) throw expensesError;

      const commissionsPending = commissions
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const commissionsPaid = commissions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const expensesPending = expenses
        .filter((e) => e.status === "pending" || e.status === "overdue")
        .reduce((sum, e) => sum + Number(e.amount), 0);

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
        .reduce((sum, e) => sum + Number(e.amount), 0) + commissionsPending;

      return {
        total: commissionsPending + expensesPending,
        commissionsPending,
        expensesPending,
        commissionsPaid,
        dueNext30,
        pendingCount: commissions.filter((c) => c.status === "pending").length,
        expensesCount: expenses.filter((e) => e.status === "pending" || e.status === "overdue").length,
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
