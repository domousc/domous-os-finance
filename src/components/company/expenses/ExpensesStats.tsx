import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingUp, AlertCircle, Calendar } from "lucide-react";

export const ExpensesStats = () => {
  const { data: expenses } = useQuery({
    queryKey: ["company-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_expenses")
        .select("*");
      
      if (error) throw error;
      return data || [];
    },
  });

  const totalPending = expenses
    ?.filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const totalOverdue = expenses
    ?.filter((e) => e.status === "overdue")
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  // Recorrência Mensal - soma o valor mensal de todas as despesas recorrentes mensais ativas
  const monthlyRecurring = expenses
    ?.filter((e) => e.billing_cycle === "monthly" && e.status !== "paid")
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  // Assinaturas Ativas - total de todas as despesas recorrentes (mensal ou anual) que estão ativas
  const activeSubscriptions = expenses
    ?.filter((e) => e.billing_cycle !== "one_time" && e.status !== "paid" && e.status !== "cancelled")
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  // Próximos 30 dias - despesas pendentes que vencem nos próximos 30 dias
  const next30Days = expenses
    ?.filter((e) => {
      const dueDate = new Date(e.due_date);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      return dueDate >= today && dueDate <= thirtyDaysFromNow && (e.status === "pending" || e.status === "overdue");
    })
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const statCards = [
    {
      title: "Total Pendente",
      value: totalPending,
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      title: "Em Atraso",
      value: totalOverdue,
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Recorrência Mensal",
      value: monthlyRecurring,
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Assinaturas Ativas",
      value: activeSubscriptions,
      icon: TrendingUp,
      color: "text-green-600",
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
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stat.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
