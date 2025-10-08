import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Users, DollarSign } from "lucide-react";
import type { Period } from "@/components/shared/PeriodFilter";
import { calculateDateRange } from "@/lib/dateFilters";

interface FinanceTimelineProps {
  period: Period;
}

export function FinanceTimeline({ period }: FinanceTimelineProps) {
  const { user } = useAuth();
  const dateRange = calculateDateRange(period);
  const { data: timeline } = useQuery({
    queryKey: ["finance-timeline", user?.id, period],
    queryFn: async () => {
      let invoicesQuery = supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          amount,
          due_date,
          status,
          clients(name)
        `)
        .in("status", ["pending", "overdue"]);

      let commissionsQuery = supabase
        .from("partner_commissions")
        .select(`
          id,
          commission_amount,
          scheduled_payment_date,
          status,
          partners(name),
          clients(name)
        `)
        .eq("status", "pending");

      let expensesQuery = supabase
        .from("company_expenses")
        .select("id, description, amount, due_date, status, type")
        .in("status", ["pending", "overdue"]);

      if (dateRange.start && dateRange.end) {
        invoicesQuery = invoicesQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());

        commissionsQuery = commissionsQuery
          .gte("scheduled_payment_date", dateRange.start.toISOString())
          .lte("scheduled_payment_date", dateRange.end.toISOString());

        expensesQuery = expensesQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const [
        { data: invoices, error: invoicesError },
        { data: commissions, error: commissionsError },
        { data: expenses, error: expensesError },
      ] = await Promise.all([
        invoicesQuery,
        commissionsQuery,
        expensesQuery,
      ]);

      if (invoicesError) throw invoicesError;
      if (commissionsError) throw commissionsError;
      if (expensesError) throw expensesError;

      const items = [
        ...(invoices || []).map((i: any) => ({
          type: "invoice" as const,
          date: new Date(i.due_date),
          description: `Fatura ${i.invoice_number} - ${i.clients?.name}`,
          amount: Number(i.amount),
        })),
        ...(commissions || []).map((c: any) => ({
          type: "commission" as const,
          date: new Date(c.scheduled_payment_date),
          description: `Comissão ${c.partners?.name} - Cliente: ${c.clients?.name}`,
          amount: -Number(c.commission_amount),
        })),
        ...(expenses || []).map((e: any) => ({
          type: "expense" as const,
          date: new Date(e.due_date),
          description: e.description,
          amount: -Number(e.amount),
        })),
      ];

      return items.sort((a, b) => a.date.getTime() - b.date.getTime());
    },
    enabled: !!user,
  });

  const typeConfig = {
    invoice: { icon: FileText, color: "text-green-600", label: "A Receber" },
    commission: { icon: Users, color: "text-blue-600", label: "Comissão" },
    expense: { icon: DollarSign, color: "text-orange-600", label: "Despesa" },
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Financeira</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline && timeline.length > 0 ? (
            timeline.map((item, index) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;

              return (
                <div
                  key={`${item.type}-${index}`}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`rounded-full p-2 ${config.color} bg-muted`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(item.date, "dd/MM/yyyy", { locale: ptBR })} • {config.label}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${item.amount > 0 ? "text-green-600" : config.color}`}>
                    {item.amount > 0 ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada para o período selecionado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
