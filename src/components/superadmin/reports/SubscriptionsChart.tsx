import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "1y";

interface SubscriptionsChartProps {
  period: Period;
}

export const SubscriptionsChart = ({ period }: SubscriptionsChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("created_at, status");

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

        const activeCount = subscriptions.filter(
          (s) =>
            s.status === "active" &&
            new Date(s.created_at) >= date &&
            new Date(s.created_at) < nextDate
        ).length;

        const trialCount = subscriptions.filter(
          (s) =>
            s.status === "trial" &&
            new Date(s.created_at) >= date &&
            new Date(s.created_at) < nextDate
        ).length;

        chartData.push({
          name: date.toLocaleDateString("pt-BR", period === "1y" || period === "90d" ? { month: "short" } : { day: "2-digit", month: "short" }),
          Ativas: activeCount,
          Trial: trialCount,
        });
      }

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [period]);

  return (
    <Card className="overflow-hidden animate-in fade-in-50 duration-700 hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-600/10">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Evolução de Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="pointer-events-auto">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTrial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                  wrapperStyle={{ pointerEvents: 'auto' }}
                />
                <Area
                  type="monotone"
                  dataKey="Ativas"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                />
                <Area
                  type="monotone"
                  dataKey="Trial"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTrial)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
