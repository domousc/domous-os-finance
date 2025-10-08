import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  current_installment: number;
  payment_method: string | null;
  notes: string | null;
  category: string | null;
}

interface ExpenseInstallmentRowProps {
  installment: Expense;
  totalInstallments: number;
}

export function ExpenseInstallmentRow({
  installment,
  totalInstallments,
}: ExpenseInstallmentRowProps) {
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Pago</Badge>;
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      case "overdue":
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const { error } = await supabase
        .from("company_expenses")
        .update({
          status: "paid",
          paid_date: new Date().toISOString(),
        })
        .eq("id", installment.id);

      if (error) throw error;

      toast({
        title: "Despesa paga",
        description: "A despesa foi marcada como paga com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar despesa",
        description: error.message,
      });
    }
  };

  return (
    <TableRow>
      <TableCell>
        {installment.current_installment || 1}/{totalInstallments}
      </TableCell>
      <TableCell>{installment.description}</TableCell>
      <TableCell>R$ {installment.amount.toFixed(2)}</TableCell>
      <TableCell>
        {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: ptBR })}
      </TableCell>
      <TableCell>{getStatusBadge(installment.status)}</TableCell>
      <TableCell className="text-right">
        {installment.status === "pending" || installment.status === "overdue" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsPaid}
          >
            <Check className="h-4 w-4 mr-1" />
            Pagar
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            {installment.paid_date
              ? format(new Date(installment.paid_date), "dd/MM/yyyy", { locale: ptBR })
              : "-"}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
