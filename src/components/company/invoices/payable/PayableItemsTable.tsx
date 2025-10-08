import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Period } from "@/components/shared/PeriodFilter";
import { calculateFutureDateRange } from "@/lib/dateFilters";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayableItemRow } from "./PayableItemRow";
import { ExpenseGroupRow } from "./ExpenseGroupRow";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface PayableItem {
  id: string;
  type: "commission" | "expense" | "expense_group";
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
  
  // Campos específicos de grupo de despesas parceladas
  installmentGroupId?: string;
  installments?: any[];
  totalAmount?: number;
  paidCount?: number;
  pendingCount?: number;
  overdueCount?: number;
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

      // Query 1: Buscar comissões pendentes
      let commissionsQuery = supabase
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
        .eq("status", "pending");

      // Query 2: Buscar despesas pendentes/atrasadas
      let expensesQuery = supabase
        .from("company_expenses")
        .select("*")
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });

      if (dateRange.start && dateRange.end) {
        commissionsQuery = commissionsQuery
          .gte("scheduled_payment_date", dateRange.start.toISOString())
          .lte("scheduled_payment_date", dateRange.end.toISOString());

        expensesQuery = expensesQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const [
        { data: commissions, error: commissionsError },
        { data: expenses, error: expensesError },
      ] = await Promise.all([
        commissionsQuery,
        expensesQuery,
      ]);

      if (commissionsError) throw commissionsError;
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

      // Agrupar despesas por installment_group_id
      const expensesGrouped = (expenses || []).reduce((acc: any, expense: any) => {
        const groupId = expense.installment_group_id;
        
        if (groupId && expense.total_installments && expense.total_installments > 1) {
          if (!acc.groups[groupId]) {
            acc.groups[groupId] = {
              installmentGroupId: groupId,
              description: expense.description,
              category: expense.category,
              installments: [],
              totalAmount: Number(expense.total_amount) || 0,
              paidCount: 0,
              pendingCount: 0,
              overdueCount: 0,
              nextDueDate: null,
            };
          }
          
          acc.groups[groupId].installments.push(expense);
          
          if (expense.status === "paid") acc.groups[groupId].paidCount++;
          else if (expense.status === "pending") acc.groups[groupId].pendingCount++;
          else if (expense.status === "overdue") acc.groups[groupId].overdueCount++;
          
          // Determinar próxima data de vencimento
          if (expense.status !== "paid") {
            const currentDue = new Date(expense.due_date);
            if (!acc.groups[groupId].nextDueDate || currentDue < new Date(acc.groups[groupId].nextDueDate)) {
              acc.groups[groupId].nextDueDate = expense.due_date;
            }
          }
        } else {
          // Despesas sem grupo ou com apenas 1 parcela
          acc.single.push(expense);
        }
        
        return acc;
      }, { groups: {}, single: [] });

      // Converter grupos de despesas para PayableItem[]
      const expenseGroupItems: PayableItem[] = Object.values(expensesGrouped.groups).map((group: any) => ({
        id: group.installmentGroupId,
        type: "expense_group" as const,
        description: group.description,
        amount: group.totalAmount,
        dueDate: new Date(group.nextDueDate || new Date()),
        status: group.overdueCount > 0 ? "overdue" : (group.paidCount === group.installments.length ? "paid" : "pending"),
        category: group.category,
        installmentGroupId: group.installmentGroupId,
        installments: group.installments,
        totalAmount: group.totalAmount,
        paidCount: group.paidCount,
        pendingCount: group.pendingCount,
        overdueCount: group.overdueCount,
      }));

      // Converter despesas individuais para PayableItem[]
      const expenseItems: PayableItem[] = expensesGrouped.single.map((expense: any) => ({
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
      const allItems = [...commissionItems, ...expenseGroupItems, ...expenseItems].sort(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, period]);

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "commissions") return item.type === "commission";
    if (activeTab === "expenses") return item.type === "expense" || item.type === "expense_group";
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
          Despesas ({items.filter((i) => i.type === "expense" || i.type === "expense_group").length})
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
                filteredItems.map((item) => 
                  item.type === "expense_group" ? (
                    <ExpenseGroupRow 
                      key={item.id} 
                      group={{
                        installmentGroupId: item.installmentGroupId!,
                        description: item.description,
                        category: item.category || null,
                        installments: item.installments || [],
                        totalAmount: item.totalAmount || 0,
                        paidCount: item.paidCount || 0,
                        pendingCount: item.pendingCount || 0,
                        overdueCount: item.overdueCount || 0,
                        nextDueDate: item.dueDate.toISOString(),
                      }}
                    />
                  ) : (
                    <PayableItemRow key={item.id} item={item} onUpdate={fetchPayableItems} />
                  )
                )
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
