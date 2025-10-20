import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateFutureDateRange } from "@/lib/dateFilters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableValueCell } from "./EditableValueCell";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Period } from "@/components/shared/PeriodFilter";

interface PayablesListProps {
  period: Period;
}

export const PayablesList = ({ period }: PayablesListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const dateRange = calculateFutureDateRange(period);

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
        .eq("company_id", profile.company_id);

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

  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">A Pagar</CardTitle>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : !payables || payables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32">
                  <EmptyState
                    icon={TrendingDown}
                    title="Nenhum pagamento encontrado"
                    description="Não há pagamentos a pagar no período selecionado."
                  />
                </TableCell>
              </TableRow>
            ) : (
              payables.map((payable) => (
                <TableRow key={payable.id} className="h-11 group">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
