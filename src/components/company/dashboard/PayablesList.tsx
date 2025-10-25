import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateDateRange } from "@/lib/dateFilters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableValueCell } from "./EditableValueCell";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SwipeableRow } from "@/components/shared/SwipeableRow";
import { RescheduleDialog } from "@/components/shared/RescheduleDialog";
import { TrendingDown, MoreVertical, Check, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Period, CustomDateRange } from "@/components/shared/PeriodFilter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PayablesListProps {
  period: Period;
  customRange?: CustomDateRange;
}

export const PayablesList = ({ period, customRange }: PayablesListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; payableId: string; currentDate: Date; type: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; payableId: string; type: string } | null>(null);
  const baseRange = calculateDateRange(period);
  const dateRange = customRange?.from && customRange?.to && period === "custom"
    ? { start: customRange.from, end: customRange.to }
    : baseRange;

  const { data: payables, isLoading } = useQuery({
    queryKey: ["dashboard-payables", user?.id, period, typeFilter],
    queryFn: async () => {
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return [];

      let query = supabase
        .from("payables")
        .select("*")
        .eq("company_id", profile.company_id)
        .in("status", ["pending", "overdue"]);

      if (dateRange.start && dateRange.end) {
        query = query
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      query = query.order("due_date", { ascending: true });

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleUpdateAmount = async (payableId: string, type: string, newAmount: number) => {
    // Update based on type
    let tableName: string;
    let error;

    switch (type) {
      case "commission":
        const { error: commError } = await supabase
          .from("partner_commissions")
          .update({ commission_amount: newAmount })
          .eq("id", payableId);
        error = commError;
        break;
      case "expense":
        const { error: expError } = await supabase
          .from("company_expenses")
          .update({ amount: newAmount })
          .eq("id", payableId);
        error = expError;
        break;
      case "salary":
        const { error: salError } = await supabase
          .from("team_payments")
          .update({ amount: newAmount })
          .eq("id", payableId);
        error = salError;
        break;
      default:
        return;
    }

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

    queryClient.invalidateQueries({ queryKey: ["dashboard-payables"] });
  };

  const handleMarkAsPaid = async (payableId: string, type: string) => {
    let error;

    switch (type) {
      case "commission":
        const { error: commError } = await supabase
          .from("partner_commissions")
          .update({ status: "paid", paid_date: new Date().toISOString() })
          .eq("id", payableId);
        error = commError;
        break;
      case "expense":
        const { error: expError } = await supabase
          .from("company_expenses")
          .update({ status: "paid", paid_date: new Date().toISOString() })
          .eq("id", payableId);
        error = expError;
        break;
      case "salary":
        const { error: salError } = await supabase
          .from("team_payments")
          .update({ status: "paid", paid_date: new Date().toISOString() })
          .eq("id", payableId);
        error = salError;
        break;
      default:
        return;
    }

    if (error) {
      toast({
        title: "Erro ao marcar como pago",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Marcado como pago",
      description: "O pagamento foi marcado como pago com sucesso.",
    });

    queryClient.invalidateQueries({ queryKey: ["dashboard-payables"] });
  };

  const handleReschedule = async (newDate: Date) => {
    if (!rescheduleDialog) return;

    let error;

    switch (rescheduleDialog.type) {
      case "commission":
        const { error: commError } = await supabase
          .from("partner_commissions")
          .update({ scheduled_payment_date: format(newDate, "yyyy-MM-dd") })
          .eq("id", rescheduleDialog.payableId);
        error = commError;
        break;
      case "expense":
        const { error: expError } = await supabase
          .from("company_expenses")
          .update({ due_date: newDate.toISOString() })
          .eq("id", rescheduleDialog.payableId);
        error = expError;
        break;
      case "salary":
        const { error: salError } = await supabase
          .from("team_payments")
          .update({ due_date: newDate.toISOString() })
          .eq("id", rescheduleDialog.payableId);
        error = salError;
        break;
      default:
        return;
    }

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

    queryClient.invalidateQueries({ queryKey: ["dashboard-payables"] });
    setRescheduleDialog(null);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Atrasado";
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "commission":
        return "Comissão";
      case "expense":
        return "Despesa";
      case "salary":
        return "Equipe";
      default:
        return type;
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    let error;

    switch (deleteDialog.type) {
      case "commission":
        const { error: commError } = await supabase
          .from("partner_commissions")
          .delete()
          .eq("id", deleteDialog.payableId);
        error = commError;
        break;
      case "expense":
        const { error: expError } = await supabase
          .from("company_expenses")
          .delete()
          .eq("id", deleteDialog.payableId);
        error = expError;
        break;
      case "salary":
        const { error: salError } = await supabase
          .from("team_payments")
          .delete()
          .eq("id", deleteDialog.payableId);
        error = salError;
        break;
      default:
        return;
    }

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Excluído com sucesso",
      description: "O pagamento foi excluído.",
    });

    queryClient.invalidateQueries({ queryKey: ["dashboard-payables"] });
    setDeleteDialog(null);
  };

  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Pagar</CardTitle>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            <SelectItem value="commission" className="text-xs">Comissões</SelectItem>
            <SelectItem value="expense" className="text-xs">Despesas</SelectItem>
            <SelectItem value="salary" className="text-xs">Equipe</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Descrição</TableHead>
              <TableHead className="text-xs">Valor</TableHead>
              <TableHead className="text-xs">Vencimento</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : !payables || payables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32">
                  <EmptyState
                    icon={TrendingDown}
                    title="Nenhum pagamento encontrado"
                    description="Não há pagamentos a pagar no período selecionado."
                  />
                </TableCell>
              </TableRow>
            ) : (
              payables.map((payable) => (
                <SwipeableRow
                  key={payable.id}
                  onMarkAsPaid={() => handleMarkAsPaid(payable.id, payable.type)}
                  onReschedule={() => setRescheduleDialog({
                    open: true,
                    payableId: payable.id,
                    currentDate: new Date(payable.due_date),
                    type: payable.type
                  })}
                  disabled={payable.status === "paid"}
                >
                  <TableRow className="h-11 group">
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] px-2 py-0">
                        {getTypeLabel(payable.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {payable.description}
                    </TableCell>
                    <TableCell>
                      <EditableValueCell
                        value={payable.amount}
                        onSave={(newValue) => handleUpdateAmount(payable.id, payable.type, newValue)}
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(payable.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(payable.status)} className="text-[10px] px-2 py-0">
                        {getStatusLabel(payable.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {payable.status !== "paid" && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(payable.id, payable.type)}>
                              <Check className="mr-2 h-4 w-4" />
                              Marcar como pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeleteDialog({ open: true, payableId: payable.id, type: payable.type })}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </SwipeableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {rescheduleDialog && (
        <RescheduleDialog
          open={rescheduleDialog.open}
          onOpenChange={(open) => !open && setRescheduleDialog(null)}
          onConfirm={handleReschedule}
          currentDate={rescheduleDialog.currentDate}
        />
      )}
      {deleteDialog && (
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
};
