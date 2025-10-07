import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { InvoiceInstallmentsDropdown } from "./InvoiceInstallmentsDropdown";

interface Client {
  name: string;
  document: string | null;
}

type Service = {
  title: string;
} | null;

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

interface GroupedInvoice {
  clientServiceId: string;
  client: Client;
  service: Service;
  installments: Invoice[];
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  canceledCount: number;
}

interface InvoiceGroupRowProps {
  group: GroupedInvoice;
}

export function InvoiceGroupRow({ group }: InvoiceGroupRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getGeneralStatus = () => {
    if (group.overdueCount > 0) {
      return { label: "Atrasado", variant: "destructive" as const };
    }
    if (group.paidCount === group.installments.length) {
      return { label: "Pago", variant: "default" as const };
    }
    if (group.canceledCount === group.installments.length) {
      return { label: "Cancelado", variant: "secondary" as const };
    }
    return { label: "Em Dia", variant: "outline" as const };
  };

  const status = getGeneralStatus();

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{group.client.name}</TableCell>
        <TableCell>
          {group.service?.title || 
           (group.installments[0]?.notes?.includes("Comissão") ? "Comissão" : "N/A")}
        </TableCell>
        <TableCell>R$ {group.totalAmount.toFixed(2)}</TableCell>
        <TableCell>
          <span className="text-sm">
            {group.paidCount}/{group.installments.length} pagas
          </span>
        </TableCell>
        <TableCell>
          <Badge variant={status.variant}>{status.label}</Badge>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-0 bg-muted/20">
            <InvoiceInstallmentsDropdown installments={group.installments} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
