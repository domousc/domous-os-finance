import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PersonalFinanceStats = () => {
  const { data: stats } = useQuery({
    queryKey: ["personal-finance-stats"],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from("personal_transactions")
        .select("*");

      if (error) throw error;

      const now = new Date();
      const receivable = transactions
        ?.filter((t) => t.type === "receivable" && t.status === "pending")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const payable = transactions
        ?.filter((t) => t.type === "payable" && t.status === "pending")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const overdue = transactions
        ?.filter((t) => t.status === "overdue").length || 0;

      const balance = receivable - payable;

      return { receivable, payable, overdue, balance };
    },
  });

  const statCards = [
    {
      title: "Total a Receber",
      value: stats?.receivable || 0,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Total a Pagar",
      value: stats?.payable || 0,
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      title: "Contas em Atraso",
      value: stats?.overdue || 0,
      icon: AlertCircle,
      color: "text-yellow-600",
      isCount: true,
    },
    {
      title: "Saldo Projetado",
      value: stats?.balance || 0,
      icon: DollarSign,
      color: (stats?.balance || 0) >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.isCount
                ? stat.value
                : stat.value.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
