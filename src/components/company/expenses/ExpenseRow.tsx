import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, Edit, Trash2, XCircle, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExpenseRowProps {
  expense: any;
  onEdit: (expense: any) => void;
}

export const ExpenseRow = ({ expense, onEdit }: ExpenseRowProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const typeLabels: Record<string, string> = {
    subscription: "Assinatura",
    service: "Serviço",
    infrastructure: "Infraestrutura",
    marketing: "Marketing",
    team: "Equipe",
    one_time: "Pontual",
  };

  const billingCycleLabels: Record<string, string> = {
    monthly: "Mensal",
    annual: "Anual",
    one_time: "Única",
  };

  const statusLabels: Record<string, { label: string; variant: any }> = {
    pending: { label: "Pendente", variant: "secondary" },
    paid: { label: "Pago", variant: "default" },
    overdue: { label: "Atrasado", variant: "destructive" },
    cancelled: { label: "Cancelado", variant: "outline" },
  };

  const markAsPaid = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_expenses")
        .update({ status: "paid", paid_date: new Date().toISOString() })
        .eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-expenses"] });
      toast({ title: "Despesa marcada como paga" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelExpense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_expenses")
        .update({ status: "cancelled" })
        .eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-expenses"] });
      toast({ title: "Despesa cancelada" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_expenses")
        .delete()
        .eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-expenses"] });
      toast({ title: "Despesa excluída" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsPending = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_expenses")
        .update({ status: "pending", paid_date: null })
        .eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-expenses"] });
      toast({ title: "Despesa voltou para pendente" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <TableRow className="group hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="font-medium text-sm">
          {expense.item}
          {expense.total_installments > 1 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({expense.current_installment}/{expense.total_installments})
            </span>
          )}
        </div>
        {expense.category && (
          <div className="text-xs text-muted-foreground">{expense.category}</div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">{typeLabels[expense.type]}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">{billingCycleLabels[expense.billing_cycle]}</Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(expense.amount)}
        </div>
        {expense.total_installments > 1 && expense.total_amount && (
          <div className="text-xs text-muted-foreground">
            Total: {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(expense.total_amount)}
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm">{format(new Date(expense.due_date), "dd/MM/yyyy")}</TableCell>
      <TableCell>
        <Badge variant={statusLabels[expense.status].variant} className="text-xs">
          {statusLabels[expense.status].label}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {expense.status === "pending" && (
              <DropdownMenuItem onClick={() => markAsPaid.mutate()}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Pago
              </DropdownMenuItem>
            )}
            {expense.status === "paid" && (
              <DropdownMenuItem onClick={() => markAsPending.mutate()}>
                <X className="mr-2 h-4 w-4" />
                Voltar para Pendente
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(expense)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {expense.status !== "cancelled" && (
              <DropdownMenuItem onClick={() => cancelExpense.mutate()}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteExpense.mutate()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
