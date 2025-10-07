import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Building2, Wallet, AlertCircle, CalendarClock } from "lucide-react";

export const FinanceOverviewStats = () => {
  const { data: stats } = useQuery({
    queryKey: ["finance-overview-stats"],
    queryFn: async () => {
      const [invoices, commissions, expenses] = await Promise.all([
        supabase.from("invoices").select("*"),
        supabase.from("partner_commissions").select("*"),
        supabase.from("company_expenses").select("*"),
      ]);

      const receivable = invoices.data
        ?.filter((i) => i.status === "pending" || i.status === "overdue")
        .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      const payable = commissions.data
        ?.filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      const operational = expenses.data
        ?.filter((e) => e.status === "pending" || e.status === "overdue")
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const overdue = [
        ...(invoices.data?.filter((i) => i.status === "overdue") || []),
        ...(expenses.data?.filter((e) => e.status === "overdue") || []),
      ].reduce((sum, item) => sum + Number(item.amount), 0);

      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const last30Days = invoices.data
        ?.filter((i) => {
          if (!i.paid_date) return false;
          const paidDate = new Date(i.paid_date);
          return paidDate >= thirtyDaysAgo && paidDate <= today;
        })
        .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      const invoicesNext30 = invoices.data
        ?.filter((i) => {
          if (i.status !== "pending") return false;
          const dueDate = new Date(i.due_date);
          return dueDate >= today && dueDate <= thirtyDaysFromNow;
        })
        .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      const expensesNext30 = expenses.data
        ?.filter((e) => {
          if (e.status !== "pending") return false;
          const dueDate = new Date(e.due_date);
          return dueDate >= today && dueDate <= thirtyDaysFromNow;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const next30Days = invoicesNext30 + expensesNext30;

      return {
        receivable,
        payable,
        operational,
        netProjected: receivable - payable - operational,
        overdue,
        last30Days,
        next30Days,
      };
    },
  });

  const statCards = [
    {
      title: "A Receber",
      value: stats?.receivable || 0,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "A Pagar (Parceiros)",
      value: stats?.payable || 0,
      icon: TrendingDown,
      color: "text-orange-600",
    },
    {
      title: "Despesas Operacionais",
      value: stats?.operational || 0,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Saldo Projetado",
      value: stats?.netProjected || 0,
      icon: Wallet,
      color: (stats?.netProjected || 0) >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Em Atraso",
      value: stats?.overdue || 0,
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Últimos 30 Dias",
      value: stats?.last30Days || 0,
      icon: CalendarClock,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
