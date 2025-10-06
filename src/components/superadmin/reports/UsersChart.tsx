import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Users } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "1y";

interface UsersChartProps {
  period: Period;
}

const COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#94a3b8"];

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  gestor: "Gestor",
  financeiro: "Financeiro",
  operador: "Operador",
};

export const UsersChart = ({ period }: UsersChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role, created_at");

      if (!userRoles) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const rolesInPeriod = userRoles.filter(
        (r) => new Date(r.created_at) >= startDate
      );

      const roleCounts: Record<string, number> = {};
      rolesInPeriod.forEach((r) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });

      const chartData = Object.entries(roleCounts).map(([role, count]) => ({
        name: roleLabels[role] || role,
        value: count,
      }));

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [period]);

  return (
    <Card className="overflow-hidden animate-in fade-in-50 duration-700 delay-300 hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-600/10">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Distribuição de Usuários por Role
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados para o período selecionado
          </div>
        ) : (
          <div className="pointer-events-auto">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  wrapperStyle={{ pointerEvents: 'auto' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
