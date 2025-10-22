import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface RevenueGrowthChartProps {
  monthsToShow?: number;
}

export const RevenueGrowthChart = ({ monthsToShow = 6 }: RevenueGrowthChartProps) => {
  const { user } = useAuth();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["revenue-growth-chart", user?.id, monthsToShow],
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

          const receivables = (invoices || [])
            .filter((i) => i.status === "pending" || i.status === "overdue")
            .reduce((sum, i) => sum + Number(i.amount), 0);

          const payables =
            ((commissions || []).filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.commission_amount), 0)) +
            ((expenses || []).filter((e) => e.status === "pending" || e.status === "overdue").reduce((sum, e) => sum + Number(e.amount), 0)) +
            ((teamPayments || []).filter((t) => t.status === "pending" || t.status === "overdue").reduce((sum, t) => sum + Number(t.amount), 0));

          const balance = receivables - payables;

          return {
            month: month.label,
            receber: receivables,
            pagar: payables,
            saldo: balance,
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
        <CardTitle className="text-base">Evolução Financeira</CardTitle>
        <p className="text-xs text-muted-foreground">
          Comparativo de receitas, despesas e saldo projetado
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
              <Line
                type="monotone"
                dataKey="receber"
                name="A Receber"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="pagar"
                name="A Pagar"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo Projetado"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
