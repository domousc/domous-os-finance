import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

export function PersonalExpenseChart() {
  const { user } = useAuth();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["personal-expense-chart", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not found");

      // Get last 6 months of data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      const { data: transactions } = await supabase
        .from("personal_transactions")
        .select("amount, due_date, status, type")
        .eq("user_id", user.id)
        .eq("type", "payable")
        .gte("due_date", sixMonthsAgo.toISOString());

      // Group by month
      const monthlyData: { [key: string]: { month: string; pago: number; pendente: number } } = {};

      transactions?.forEach((transaction) => {
        const date = new Date(transaction.due_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, pago: 0, pendente: 0 };
        }

        const amount = Number(transaction.amount);
        if (transaction.status === "paid") {
          monthlyData[monthKey].pago += amount;
        } else {
          monthlyData[monthKey].pendente += amount;
        }
      });

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos Mensais</CardTitle>
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
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Bar dataKey="pago" name="Pago" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendente" name="Pendente" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
