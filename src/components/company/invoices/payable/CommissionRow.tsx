import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Check } from "lucide-react";
import { PayCommissionDialog } from "./PayCommissionDialog";

interface Commission {
  id: string;
  commission_amount: number;
  base_amount: number;
  commission_percentage: number;
  reference_month: string;
  status: string;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  partners: {
    name: string;
  };
  clients: {
    name: string;
    company_name: string | null;
  };
}

interface CommissionRowProps {
  commission: Commission;
}

export function CommissionRow({ commission }: CommissionRowProps) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge>Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <TableRow className="bg-muted/20">
        <TableCell></TableCell>
        <TableCell className="pl-12">
          {commission.clients.company_name || commission.clients.name}
        </TableCell>
        <TableCell>
          {format(new Date(commission.reference_month), "MM/yyyy")}
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>Base: {formatCurrency(Number(commission.base_amount))}</div>
            <div className="text-muted-foreground">
              {commission.commission_percentage}%
            </div>
          </div>
        </TableCell>
        <TableCell className="font-semibold">
          {formatCurrency(Number(commission.commission_amount))}
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            {getStatusBadge(commission.status)}
            {commission.paid_date && (
              <div className="text-xs text-muted-foreground">
                Pago em: {format(new Date(commission.paid_date), "dd/MM/yyyy")}
              </div>
            )}
            {commission.payment_method && (
              <div className="text-xs text-muted-foreground">
                Via: {commission.payment_method}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          {commission.status === "pending" && (
            <Button size="sm" onClick={() => setPayDialogOpen(true)}>
              <Check className="h-4 w-4 mr-2" />
              Pagar
            </Button>
          )}
        </TableCell>
      </TableRow>

      <PayCommissionDialog
        open={payDialogOpen}
        onClose={() => setPayDialogOpen(false)}
        commission={commission}
      />
    </>
  );
}
