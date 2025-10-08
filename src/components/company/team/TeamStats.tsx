import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Period, getDateRangeFilter } from "@/lib/dateFilters";

interface TeamStatsProps {
  period: Period;
}

export const TeamStats = ({ period }: TeamStatsProps) => {
  const { data: stats } = useQuery({
    queryKey: ["team-stats", period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("No company");

      const dateFilter = getDateRangeFilter(period);

      // Buscar todos os pagamentos do período
      const { data: payments } = await supabase
        .from("team_payments")
        .select("*")
        .eq("company_id", profile.company_id)
        .gte("due_date", dateFilter.start)
        .lte("due_date", dateFilter.end);

      const monthlyTotal = payments
        ?.filter(p => p.payment_type === 'salary')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const variableTotal = payments
        ?.filter(p => p.payment_type === 'service')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const paidTotal = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingTotal = payments
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        monthlyTotal,
        variableTotal,
        paidTotal,
        pendingTotal
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const statsCards = [
    {
      title: "Folha Mensal",
      value: formatCurrency(stats?.monthlyTotal || 0),
      icon: DollarSign,
      description: "Salários fixos",
    },
    {
      title: "Variáveis",
      value: formatCurrency(stats?.variableTotal || 0),
      icon: TrendingUp,
      description: "Pagamentos por demanda",
    },
    {
      title: "Total Pago",
      value: formatCurrency(stats?.paidTotal || 0),
      icon: CheckCircle,
      description: "Pagamentos realizados",
    },
    {
      title: "Pendente",
      value: formatCurrency(stats?.pendingTotal || 0),
      icon: Clock,
      description: "A pagar no período",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => (
        <Card key={stat.title} className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
            <stat.icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      ))}
    </div>
  );
};
