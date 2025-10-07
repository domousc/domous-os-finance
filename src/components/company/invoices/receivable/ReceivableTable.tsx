import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceGroupRow } from "./InvoiceGroupRow";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  cycle_number: number;
  client_service_id: string;
  payment_method: string | null;
  notes: string | null;
}

interface Client {
  name: string;
  document: string | null;
}

interface Service {
  title: string;
}

interface InvoiceWithRelations extends Invoice {
  clients: Client;
  services: Service;
}

interface GroupedInvoice {
  clientServiceId: string;
  client: Client;
  service: Service;
  installments: InvoiceWithRelations[];
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  canceledCount: number;
}

export function ReceivableTable() {
  const [groupedInvoices, setGroupedInvoices] = useState<GroupedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();

    const channel = supabase
      .channel("invoices-receivable-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          fetchInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          clients (
            name,
            document
          ),
          services (
            title
          )
        `
        )
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Agrupar por client_service_id
      const grouped = (data as InvoiceWithRelations[]).reduce((acc, invoice) => {
        const key = invoice.client_service_id;
        if (!acc[key]) {
          acc[key] = {
            clientServiceId: key,
            client: invoice.clients,
            service: invoice.services,
            installments: [],
            totalAmount: 0,
            paidCount: 0,
            pendingCount: 0,
            overdueCount: 0,
            canceledCount: 0,
          };
        }
        
        acc[key].installments.push(invoice);
        acc[key].totalAmount += invoice.amount;
        
        // Contar status
        if (invoice.status === "paid") acc[key].paidCount++;
        else if (invoice.status === "pending") acc[key].pendingCount++;
        else if (invoice.status === "overdue") acc[key].overdueCount++;
        else if (invoice.status === "canceled") acc[key].canceledCount++;
        
        return acc;
      }, {} as Record<string, GroupedInvoice>);

      setGroupedInvoices(Object.values(grouped));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar faturas",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Parcelas</TableHead>
            <TableHead>Status Geral</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedInvoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhuma fatura encontrada
              </TableCell>
            </TableRow>
          ) : (
            groupedInvoices.map((group) => (
              <InvoiceGroupRow key={group.clientServiceId} group={group} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
