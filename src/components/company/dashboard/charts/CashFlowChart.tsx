import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface CashFlowChartProps {
  monthsToShow?: number;
}

export const CashFlowChart = ({ monthsToShow = 6 }: CashFlowChartProps) => {
  const { user } = useAuth();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["cash-flow-chart", user?.id, monthsToShow],
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

      let accumulated = 0;
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
              .select("amount, status, paid_date")
              .eq("company_id", profile.company_id)
              .eq("status", "paid")
              .gte("paid_date", month.start.toISOString())
              .lte("paid_date", month.end.toISOString()),
            supabase
              .from("partner_commissions")
              .select("commission_amount, status, paid_date")
              .eq("company_id", profile.company_id)
              .eq("status", "paid")
              .gte("paid_date", month.start.toISOString())
              .lte("paid_date", month.end.toISOString()),
            supabase
              .from("company_expenses")
              .select("amount, status, paid_date")
              .eq("company_id", profile.company_id)
              .eq("status", "paid")
              .gte("paid_date", month.start.toISOString())
              .lte("paid_date", month.end.toISOString()),
            supabase
              .from("team_payments")
              .select("amount, status, paid_date")
              .eq("company_id", profile.company_id)
              .eq("status", "paid")
              .gte("paid_date", month.start.toISOString())
              .lte("paid_date", month.end.toISOString()),
          ]);

          const inflow = (invoices || []).reduce((sum, i) => sum + Number(i.amount), 0);
          const outflow =
            ((commissions || []).reduce((sum, c) => sum + Number(c.commission_amount), 0)) +
            ((expenses || []).reduce((sum, e) => sum + Number(e.amount), 0)) +
            ((teamPayments || []).reduce((sum, t) => sum + Number(t.amount), 0));

          accumulated += inflow - outflow;

          return {
            month: month.label,
            entradas: inflow,
            saidas: outflow,
            acumulado: accumulated,
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
        <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
        <p className="text-xs text-muted-foreground">
          Entradas e saídas efetivas (valores já pagos)
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="hsl(142, 76%, 36%)"
                fill="url(#colorInflow)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="hsl(0, 84%, 60%)"
                fill="url(#colorOutflow)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="acumulado"
                name="Saldo Acumulado"
                stroke="hsl(221, 83%, 53%)"
                fill="transparent"
                strokeWidth={3}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
