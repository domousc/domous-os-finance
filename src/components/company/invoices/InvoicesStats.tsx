import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Stats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
}

export function InvoicesStats() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel("invoices-stats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("amount, status");

      if (error) throw error;

      const stats = invoices?.reduce(
        (acc, invoice) => {
          acc.total += Number(invoice.amount);
          if (invoice.status === "pending") {
            acc.pending += Number(invoice.amount);
          } else if (invoice.status === "paid") {
            acc.paid += Number(invoice.amount);
          } else if (invoice.status === "overdue") {
            acc.overdue += Number(invoice.amount);
          }
          return acc;
        },
        { total: 0, pending: 0, paid: 0, overdue: 0 }
      );

      setStats(stats || { total: 0, pending: 0, paid: 0, overdue: 0 });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar estatísticas",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total a Receber",
      value: stats.total,
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "Pendente",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Recebido",
      value: stats.paid,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Atrasado",
      value: stats.overdue,
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {card.value.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
