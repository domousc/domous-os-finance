import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface FinancialBreakdownChartProps {
  monthsToShow?: number;
}

export const FinancialBreakdownChart = ({ monthsToShow = 6 }: FinancialBreakdownChartProps) => {
  const { user } = useAuth();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["financial-breakdown-chart", user?.id, monthsToShow],
    queryFn: async () => {
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return [];

      const months = [];
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, "MMM/yy", { locale: ptBR }),
        });
      }

      const results = await Promise.all(
        months.map(async (month) => {
          const [
            { data: invoices },
            { data: commissions },
            { data: expenses },
            { data: teamPayments },
          ] = await Promise.all([
            supabase
              .from("invoices")
              .select("amount, status")
              .eq("company_id", profile.company_id)
              .gte("due_date", month.start.toISOString())
              .lte("due_date", month.end.toISOString()),
            supabase
              .from("partner_commissions")
              .select("commission_amount, status")
              .eq("company_id", profile.company_id)
              .gte("scheduled_payment_date", month.start.toISOString())
              .lte("scheduled_payment_date", month.end.toISOString()),
            supabase
              .from("company_expenses")
              .select("amount, status")
              .eq("company_id", profile.company_id)
              .gte("due_date", month.start.toISOString())
              .lte("due_date", month.end.toISOString()),
            supabase
              .from("team_payments")
              .select("amount, status")
              .eq("company_id", profile.company_id)
              .gte("due_date", month.start.toISOString())
              .lte("due_date", month.end.toISOString()),
          ]);

          const revenues = (invoices || []).reduce((sum, i) => sum + Number(i.amount), 0);
          const commissionsTotal = (commissions || []).reduce((sum, c) => sum + Number(c.commission_amount), 0);
          const expensesTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
          const teamPaymentsTotal = (teamPayments || []).reduce((sum, t) => sum + Number(t.amount), 0);

          return {
            month: month.label,
            receitas: revenues,
            comissoes: commissionsTotal,
            despesas: expensesTotal,
            folha: teamPaymentsTotal,
          };
        })
      );

      return results;
    },
    enabled: !!user,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Composição Financeira Mensal</CardTitle>
        <p className="text-xs text-muted-foreground">
          Distribuição de receitas e despesas por categoria
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                className="text-xs"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value)}
                className="text-xs"
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" />
              <Bar dataKey="comissoes" name="Comissões" fill="hsl(221, 83%, 53%)" />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(24, 95%, 53%)" />
              <Bar dataKey="folha" name="Folha" fill="hsl(262, 83%, 58%)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
