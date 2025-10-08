import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Period } from "@/components/shared/PeriodFilter";
import { calculateFutureDateRange } from "@/lib/dateFilters";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Loader2, Users, Receipt, HandCoins, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface PayableItem {
  id: string;
  type: "team" | "expense" | "commission";
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
  paymentMethod?: string;
  category?: string;
  notes?: string;
}

interface PayableItemsTableProps {
  period: Period;
}

export function PayableItemsTable({ period }: PayableItemsTableProps) {
  const dateRange = calculateFutureDateRange(period);
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PayableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchPayableItems = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from("payables")
        .select("*")
        .eq("status", "pending")
        .order("due_date", { ascending: true });

      if (dateRange.start && dateRange.end) {
        query = query
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const processedItems: PayableItem[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        amount: Number(item.amount),
        dueDate: new Date(item.due_date),
        status: item.status,
        paymentMethod: item.payment_method,
        category: item.expense_category,
        notes: item.notes,
      }));

      setItems(processedItems);
    } catch (error: any) {
      console.error("Error fetching payable items:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayableItems();

    const channel = supabase
      .channel("payables-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payables" },
        () => fetchPayableItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, period]);

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "commissions") return item.type === "commission";
    if (activeTab === "expenses") return item.type === "expense";
    if (activeTab === "team") return item.type === "team";
    return true;
  });

  const totalAmount = filteredItems.reduce((sum, item) => sum + item.amount, 0);

  const getTypeBadge = (type: string) => {
    const badges = {
      team: { icon: Users, label: "Equipe", variant: "default" as const },
      expense: { icon: Receipt, label: "Despesa", variant: "secondary" as const },
      commission: { icon: HandCoins, label: "Comissão", variant: "outline" as const },
    };
    const config = badges[type as keyof typeof badges];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payables")
        .update({ 
          status: "paid",
          paid_date: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Pagamento registrado",
        description: "O item foi marcado como pago.",
      });
      
      fetchPayableItems();
    } catch (error: any) {
      console.error("Error marking as paid:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar como pago.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: PayableItem) => {
    try {
      // Delete from payables table
      const { error: payablesError } = await supabase
        .from("payables")
        .delete()
        .eq("id", item.id);

      if (payablesError) throw payablesError;

      // Delete from original table based on type
      if (item.type === "team") {
        const { error } = await supabase
          .from("team_payments")
          .delete()
          .eq("id", item.id);
        if (error) throw error;
      } else if (item.type === "expense") {
        const { error } = await supabase
          .from("company_expenses")
          .delete()
          .eq("id", item.id);
        if (error) throw error;
      } else if (item.type === "commission") {
        const { error } = await supabase
          .from("partner_commissions")
          .delete()
          .eq("id", item.id);
        if (error) throw error;
      }
      
      toast({
        title: "Item excluído",
        description: "O item foi removido com sucesso.",
      });
      
      fetchPayableItems();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">Todas ({items.length})</TabsTrigger>
        <TabsTrigger value="commissions">
          Comissões ({items.filter((i) => i.type === "commission").length})
        </TabsTrigger>
        <TabsTrigger value="expenses">
          Despesas ({items.filter((i) => i.type === "expense").length})
        </TabsTrigger>
        <TabsTrigger value="team">
          Equipe ({items.filter((i) => i.type === "team").length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum item a pagar encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{getTypeBadge(item.type)}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell>
                      {item.dueDate.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "pending" ? "destructive" : "default"}>
                        {item.status === "pending" ? "Pendente" : "Pago"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(item.id)}
                          >
                            Marcar como pago
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita e o item será removido de todas as páginas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredItems.length > 0 && (
          <div className="flex justify-end items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Total:</span>
            <span className="text-lg">
              {totalAmount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
