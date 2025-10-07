import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Pencil } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InvoicePaymentDialog } from "../InvoicePaymentDialog";
import { EditInvoiceDialog } from "../EditInvoiceDialog";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  cycle_number: number;
  payment_method: string | null;
  notes: string | null;
}

interface InstallmentRowProps {
  installment: Invoice;
  totalInstallments: number;
}

export function InstallmentRow({
  installment,
  totalInstallments,
}: InstallmentRowProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      paid: "Pago",
      canceled: "Cancelado",
      overdue: "Atrasado",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      canceled: "bg-gray-100 text-gray-800",
      overdue: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const handleCancelInvoice = async () => {
    if (!confirm("Deseja realmente cancelar esta parcela?")) return;

    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "canceled" })
        .eq("id", installment.id);

      if (error) throw error;

      toast({
        title: "Parcela cancelada",
        description: "Parcela cancelada com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar parcela",
        description: error.message,
      });
    }
  };

  const rowClassName =
    installment.status === "overdue" ? "bg-red-50 hover:bg-red-100" : "";

  return (
    <>
      <TableRow className={rowClassName}>
        <TableCell>
          {installment.cycle_number}/{totalInstallments}
        </TableCell>
        <TableCell className="font-medium">
          {installment.invoice_number}
        </TableCell>
        <TableCell>R$ {installment.amount.toFixed(2)}</TableCell>
        <TableCell>{format(new Date(installment.due_date), "dd/MM/yyyy")}</TableCell>
        <TableCell>
          <span
            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
              installment.status
            )}`}
          >
            {getStatusLabel(installment.status)}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            {installment.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  title="Editar fatura"
                >
                  <Pencil className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentDialogOpen(true)}
                  title="Marcar como paga"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelInvoice}
                  title="Cancelar"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      <InvoicePaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        invoice={installment}
      />

      <EditInvoiceDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        invoice={installment}
      />
    </>
  );
}
