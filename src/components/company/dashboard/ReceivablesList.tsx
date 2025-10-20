import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableValueCell } from "./EditableValueCell";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReceivablesListProps {
  period: string;
}

export const ReceivablesList = ({ period }: ReceivablesListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["dashboard-receivables", user?.id, period, statusFilter],
    queryFn: async () => {
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return [];

      let query = supabase
        .from("invoices")
        .select(`
          *,
          clients(name),
          services(title)
        `)
        .eq("company_id", profile.company_id)
        .order("due_date", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleUpdateAmount = async (invoiceId: string, newAmount: number) => {
    const { error } = await supabase
      .from("invoices")
      .update({ amount: newAmount })
      .eq("id", invoiceId);

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
      description: "O valor da fatura foi atualizado com sucesso.",
    });

    queryClient.invalidateQueries({ queryKey: ["dashboard-receivables"] });
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

  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">A Receber</CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos</SelectItem>
            <SelectItem value="pending" className="text-xs">Pendente</SelectItem>
            <SelectItem value="paid" className="text-xs">Pago</SelectItem>
            <SelectItem value="overdue" className="text-xs">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              <TableHead className="text-xs">Cliente</TableHead>
              <TableHead className="text-xs">Serviço</TableHead>
              <TableHead className="text-xs">Valor</TableHead>
              <TableHead className="text-xs">Vencimento</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : !invoices || invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32">
                  <EmptyState
                    icon={TrendingUp}
                    title="Nenhuma fatura encontrada"
                    description="Não há faturas a receber no período selecionado."
                  />
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="h-11 group">
                  <TableCell className="text-xs font-medium">
                    {invoice.clients?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {invoice.services?.title || "N/A"}
                  </TableCell>
                  <TableCell>
                    <EditableValueCell
                      value={invoice.amount}
                      onSave={(newValue) => handleUpdateAmount(invoice.id, newValue)}
                    />
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)} className="text-[10px] px-2 py-0">
                      {getStatusLabel(invoice.status)}
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
