import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "1y";

interface RevenueChartProps {
  period: Period;
}

export const RevenueChart = ({ period }: RevenueChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("created_at, status, plans(price, billing_period)");

      if (!subscriptions) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
      const dataPoints = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 12 : 12;

      const chartData = [];
      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * (periodDays / dataPoints) * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + (periodDays / dataPoints) * 24 * 60 * 60 * 1000);

        const revenue = subscriptions
          .filter(
            (s) =>
              s.status === "active" &&
              new Date(s.created_at) >= date &&
              new Date(s.created_at) < nextDate
          )
          .reduce((sum, s) => sum + (Number(s.plans?.price) || 0), 0);

        chartData.push({
          name: date.toLocaleDateString("pt-BR", period === "1y" || period === "90d" ? { month: "short" } : { day: "2-digit", month: "short" }),
          Receita: revenue,
        });
      }

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [period]);

  return (
    <Card className="overflow-hidden animate-in fade-in-50 duration-700 delay-200 hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-600/10">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-orange-600" />
          Evolução da Receita
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
              <Line
                type="monotone"
                dataKey="Receita"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
