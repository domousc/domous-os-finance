import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const FinanceTimeline = () => {
  const { data: timeline } = useQuery({
    queryKey: ["finance-timeline"],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [invoices, commissions, expenses] = await Promise.all([
        supabase
          .from("invoices")
          .select("*, clients(name)")
          .gte("due_date", today.toISOString())
          .lte("due_date", thirtyDaysFromNow.toISOString())
          .eq("status", "pending")
          .order("due_date", { ascending: true }),
        supabase
          .from("partner_commissions")
          .select("*, partners(name)")
          .eq("status", "pending")
          .order("reference_month", { ascending: true })
          .limit(10),
        supabase
          .from("company_expenses")
          .select("*")
          .gte("due_date", today.toISOString())
          .lte("due_date", thirtyDaysFromNow.toISOString())
          .eq("status", "pending")
          .order("due_date", { ascending: true }),
      ]);

      const items = [
        ...(invoices.data?.map((i) => ({
          id: i.id,
          type: "receivable" as const,
          date: new Date(i.due_date),
          description: `Fatura ${i.invoice_number} - ${i.clients?.name}`,
          amount: Number(i.amount),
        })) || []),
        ...(commissions.data?.map((c) => ({
          id: c.id,
          type: "payable" as const,
          date: new Date(c.reference_month),
          description: `Comissão - ${c.partners?.name}`,
          amount: Number(c.commission_amount),
        })) || []),
        ...(expenses.data?.map((e) => ({
          id: e.id,
          type: "expense" as const,
          date: new Date(e.due_date),
          description: e.description,
          amount: Number(e.amount),
        })) || []),
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      return items;
    },
  });

  const typeConfig = {
    receivable: { label: "A Receber", variant: "default" as const, color: "text-green-600" },
    payable: { label: "A Pagar", variant: "secondary" as const, color: "text-orange-600" },
    expense: { label: "Despesa", variant: "outline" as const, color: "text-blue-600" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos 30 Dias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline && timeline.length > 0 ? (
            timeline.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={typeConfig[item.type].variant}>
                      {typeConfig[item.type].label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(item.date, "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-1">{item.description}</p>
                </div>
                <div className={`text-lg font-bold ${typeConfig[item.type].color}`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.amount)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação programada para os próximos 30 dias
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
