import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, Edit, Trash, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SwipeableRow } from "@/components/shared/SwipeableRow";
import { RescheduleDialog } from "@/components/shared/RescheduleDialog";
import { EditableValueCell } from "@/components/company/dashboard/EditableValueCell";
import { useState } from "react";

interface TransactionRowProps {
  transaction: any;
  onEdit: (transaction: any) => void;
}

const STATUS_MAP = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Pago", color: "bg-green-100 text-green-800" },
  overdue: { label: "Atrasado", color: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
};

export const TransactionRow = ({ transaction, onEdit }: TransactionRowProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; currentDate: Date } | null>(null);

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("personal_transactions")
        .update({ status: "paid", paid_date: new Date().toISOString() })
        .eq("id", transaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["personal-finance-stats"] });
      toast({ title: "Transação marcada como paga" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("personal_transactions")
        .update({ status: "cancelled" })
        .eq("id", transaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["personal-finance-stats"] });
      toast({ title: "Transação cancelada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("personal_transactions").delete().eq("id", transaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["personal-finance-stats"] });
      toast({ title: "Transação excluída" });
      setShowDeleteDialog(false);
    },
  });

  const markAsPendingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("personal_transactions")
        .update({ status: "pending", paid_date: null })
        .eq("id", transaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["personal-finance-stats"] });
      toast({ title: "Transação voltou para pendente" });
    },
  });

  const handleReschedule = async (newDate: Date) => {
    const { error } = await supabase
      .from("personal_transactions")
      .update({ due_date: newDate.toISOString() })
      .eq("id", transaction.id);
    
    if (error) {
      toast({
        title: "Erro ao reagendar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reagendado com sucesso",
      description: "A data de vencimento foi atualizada.",
    });

    queryClient.invalidateQueries({ queryKey: ["personal-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["personal-finance-stats"] });
    setRescheduleDialog(null);
  };

  const handleUpdateAmount = async (newAmount: number) => {
    const { error } = await supabase
      .from("personal_transactions")
      .update({ amount: newAmount })
      .eq("id", transaction.id);
    
    if (error) {
      toast({
        title: "Erro ao atualizar valor",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Valor atualizado",
      description: "O valor foi atualizado com sucesso.",
    });

    queryClient.invalidateQueries({ queryKey: ["personal-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["personal-finance-stats"] });
  };

  // Only show swipe actions for "A Pagar" (payable) transactions
  const isPayable = transaction.type === "payable";

  return (
    <>
      {isPayable ? (
        <SwipeableRow
          onMarkAsPaid={() => markAsPaidMutation.mutate()}
          onReschedule={() => setRescheduleDialog({
            open: true,
            currentDate: new Date(transaction.due_date)
          })}
          disabled={transaction.status === "paid"}
        >
          <TableRow>
            <TableCell>{format(new Date(transaction.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
            <TableCell>
              <Badge variant={transaction.type === "receivable" ? "default" : "destructive"}>
                {transaction.type === "receivable" ? "A Receber" : "A Pagar"}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{transaction.description}</TableCell>
            <TableCell>{transaction.category || "-"}</TableCell>
            <TableCell className="text-right">
              <EditableValueCell
                value={transaction.amount}
                onSave={handleUpdateAmount}
              />
            </TableCell>
            <TableCell>
              <Badge className={STATUS_MAP[transaction.status as keyof typeof STATUS_MAP].color}>
                {STATUS_MAP[transaction.status as keyof typeof STATUS_MAP].label}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {transaction.status === "pending" && (
                    <DropdownMenuItem onClick={() => markAsPaidMutation.mutate()}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Pago
                    </DropdownMenuItem>
                  )}
                  {transaction.status === "paid" && (
                    <DropdownMenuItem onClick={() => markAsPendingMutation.mutate()}>
                      <X className="mr-2 h-4 w-4" />
                      Voltar para Pendente
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onEdit(transaction)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  {transaction.status === "pending" && (
                    <DropdownMenuItem onClick={() => cancelMutation.mutate()}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </SwipeableRow>
      ) : (
        <TableRow>
          <TableCell>{format(new Date(transaction.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
          <TableCell>
            <Badge variant={transaction.type === "receivable" ? "default" : "destructive"}>
              {transaction.type === "receivable" ? "A Receber" : "A Pagar"}
            </Badge>
          </TableCell>
          <TableCell className="font-medium">{transaction.description}</TableCell>
          <TableCell>{transaction.category || "-"}</TableCell>
          <TableCell className="text-right">
            <EditableValueCell
              value={transaction.amount}
              onSave={handleUpdateAmount}
            />
          </TableCell>
          <TableCell>
            <Badge className={STATUS_MAP[transaction.status as keyof typeof STATUS_MAP].color}>
              {STATUS_MAP[transaction.status as keyof typeof STATUS_MAP].label}
            </Badge>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {transaction.status === "pending" && (
                  <DropdownMenuItem onClick={() => markAsPaidMutation.mutate()}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Pago
                  </DropdownMenuItem>
                )}
                {transaction.status === "paid" && (
                  <DropdownMenuItem onClick={() => markAsPendingMutation.mutate()}>
                    <X className="mr-2 h-4 w-4" />
                    Voltar para Pendente
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(transaction)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {transaction.status === "pending" && (
                  <DropdownMenuItem onClick={() => cancelMutation.mutate()}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      )}

      {rescheduleDialog && (
        <RescheduleDialog
          open={rescheduleDialog.open}
          onOpenChange={(open) => !open && setRescheduleDialog(null)}
          onConfirm={handleReschedule}
          currentDate={rescheduleDialog.currentDate}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
