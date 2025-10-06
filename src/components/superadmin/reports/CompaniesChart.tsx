import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building2 } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "1y";

interface CompaniesChartProps {
  period: Period;
}

export const CompaniesChart = ({ period }: CompaniesChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: companies } = await supabase
        .from("companies")
        .select("created_at, status");

      if (!companies) {
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

        const activeCount = companies.filter(
          (c) =>
            c.status === "active" &&
            new Date(c.created_at) >= date &&
            new Date(c.created_at) < nextDate
        ).length;

        const inactiveCount = companies.filter(
          (c) =>
            c.status === "inactive" &&
            new Date(c.created_at) >= date &&
            new Date(c.created_at) < nextDate
        ).length;

        chartData.push({
          name: date.toLocaleDateString("pt-BR", period === "1y" || period === "90d" ? { month: "short" } : { day: "2-digit", month: "short" }),
          Ativas: activeCount,
          Inativas: inactiveCount,
        });
      }

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [period]);

  return (
    <Card className="overflow-hidden animate-in fade-in-50 duration-700 delay-100 hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-600/10">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Cadastro de Empresas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <defs>
                <linearGradient id="colorActiveCompanies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorInactiveCompanies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.6} />
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
              />
              <Bar dataKey="Ativas" fill="url(#colorActiveCompanies)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Inativas" fill="url(#colorInactiveCompanies)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
