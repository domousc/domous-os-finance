import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayableItemRow } from "./PayableItemRow";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface PayableItem {
  id: string;
  type: "commission" | "expense";
  description: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paymentMethod?: string;
  
  // Campos específicos de comissão
  partnerId?: string;
  partnerName?: string;
  commissionDetails?: {
    percentage: number;
    baseAmount: number;
    clients: Array<{ name: string; amount: number; invoice_number: string }>;
    scheduledPaymentDate: Date;
  };
  
  // Campos específicos de despesa
  expenseType?: string;
  billingCycle?: string;
  category?: string;
  notes?: string;
}

export function PayableItemsTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PayableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchPayableItems = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Query 1: Buscar comissões pendentes cujas faturas foram pagas
      const { data: commissions, error: commissionsError } = await supabase
        .from("partner_commissions")
        .select(`
          id,
          commission_amount,
          commission_percentage,
          base_amount,
          status,
          payment_method,
          scheduled_payment_date,
          reference_month,
          partners!inner (
            id,
            name
          ),
          invoices!partner_commissions_client_invoice_id_fkey!inner (
            id,
            invoice_number,
            status,
            amount,
            clients!inner (
              id,
              name
            )
          )
        `)
        .eq("status", "pending")
        .eq("invoices.status", "paid");

      if (commissionsError) throw commissionsError;

      // Query 2: Buscar despesas pendentes/atrasadas
      const { data: expenses, error: expensesError } = await supabase
        .from("company_expenses")
        .select("*")
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });

      if (expensesError) throw expensesError;

      // Agrupar comissões por parceiro
      const commissionsGrouped = commissions?.reduce((acc: any, comm: any) => {
        const partnerId = comm.partners.id;
        
        if (!acc[partnerId]) {
          acc[partnerId] = {
            partnerId,
            partnerName: comm.partners.name,
            totalAmount: 0,
            scheduledPaymentDate: comm.scheduled_payment_date,
            clients: [],
            commissionId: comm.id,
            status: comm.status,
            paymentMethod: comm.payment_method,
          };
        }
        
        acc[partnerId].totalAmount += Number(comm.commission_amount);
        acc[partnerId].clients.push({
          name: comm.invoices.clients.name,
          amount: Number(comm.commission_amount),
          invoice_number: comm.invoices.invoice_number,
        });
        
        return acc;
      }, {});

      // Converter comissões agrupadas para PayableItem[]
      const commissionItems: PayableItem[] = Object.values(commissionsGrouped || {}).map((group: any) => ({
        id: group.commissionId,
        type: "commission" as const,
        description: `Comissão - ${group.partnerName}`,
        amount: group.totalAmount,
        dueDate: new Date(group.scheduledPaymentDate),
        status: group.status,
        paymentMethod: group.paymentMethod,
        partnerId: group.partnerId,
        partnerName: group.partnerName,
        commissionDetails: {
          percentage: 0, // Será calculado pelo row
          baseAmount: group.totalAmount,
          clients: group.clients,
          scheduledPaymentDate: new Date(group.scheduledPaymentDate),
        },
      }));

      // Converter despesas para PayableItem[]
      const expenseItems: PayableItem[] = (expenses || []).map((expense) => ({
        id: expense.id,
        type: "expense" as const,
        description: expense.description,
        amount: Number(expense.amount),
        dueDate: new Date(expense.due_date),
        status: expense.status,
        paymentMethod: expense.payment_method,
        expenseType: expense.type,
        billingCycle: expense.billing_cycle,
        category: expense.category,
        notes: expense.notes,
      }));

      // Mesclar e ordenar por data de vencimento
      const allItems = [...commissionItems, ...expenseItems].sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
      );

      setItems(allItems);
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

    // Real-time updates
    const channel = supabase
      .channel("payable-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partner_commissions",
        },
        () => fetchPayableItems()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "company_expenses",
        },
        () => fetchPayableItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "commissions") return item.type === "commission";
    if (activeTab === "expenses") return item.type === "expense";
    return true;
  });

  const totalAmount = filteredItems.reduce((sum, item) => sum + item.amount, 0);

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
      </TabsList>

      <TabsContent value={activeTab} className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum item a pagar encontrado
                  </td>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <PayableItemRow key={item.id} item={item} onUpdate={fetchPayableItems} />
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
