import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { CommissionRow } from "./CommissionRow";

interface Partner {
  name: string;
  pix_key: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
}

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
  partners: Partner;
  clients: {
    name: string;
    company_name: string | null;
  };
}

interface GroupedCommission {
  partnerId: string;
  partner: Partner;
  commissions: Commission[];
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  cancelledCount: number;
}

interface PartnerCommissionGroupRowProps {
  group: GroupedCommission;
}

export function PartnerCommissionGroupRow({ group }: PartnerCommissionGroupRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getStatusBadge = () => {
    if (group.pendingCount > 0 && group.paidCount === 0) {
      return <Badge variant="secondary">Pendente</Badge>;
    }
    if (group.paidCount > 0 && group.pendingCount === 0) {
      return <Badge>Pago</Badge>;
    }
    if (group.cancelledCount === group.commissions.length) {
      return <Badge variant="destructive">Cancelado</Badge>;
    }
    return <Badge variant="outline">Parcial</Badge>;
  };

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{group.partner.name}</TableCell>
        <TableCell className="text-sm">
          {group.partner.pix_key && (
            <div className="text-muted-foreground">PIX: {group.partner.pix_key}</div>
          )}
          {group.partner.bank_name && (
            <div className="text-muted-foreground">
              {group.partner.bank_name} - Ag: {group.partner.bank_agency} - Cc: {group.partner.bank_account}
            </div>
          )}
          {!group.partner.pix_key && !group.partner.bank_name && (
            <div className="text-muted-foreground">Sem dados bancários</div>
          )}
        </TableCell>
        <TableCell className="font-bold">{formatCurrency(group.totalAmount)}</TableCell>
        <TableCell>
          <div className="text-sm">
            <div>Total: {group.commissions.length}</div>
            {group.pendingCount > 0 && (
              <div className="text-yellow-600">Pendentes: {group.pendingCount}</div>
            )}
            {group.paidCount > 0 && (
              <div className="text-green-600">Pagas: {group.paidCount}</div>
            )}
          </div>
        </TableCell>
        <TableCell>{getStatusBadge()}</TableCell>
      </TableRow>

      {isExpanded && (
        <>
          <TableRow className="bg-muted/10">
            <TableCell></TableCell>
            <TableCell className="font-semibold text-sm">Cliente</TableCell>
            <TableCell className="font-semibold text-sm">Mês Ref.</TableCell>
            <TableCell className="font-semibold text-sm">Base / %</TableCell>
            <TableCell className="font-semibold text-sm">Comissão</TableCell>
            <TableCell className="font-semibold text-sm">Status</TableCell>
            <TableCell className="font-semibold text-sm">Ações</TableCell>
          </TableRow>
          {group.commissions.map((commission) => (
            <CommissionRow key={commission.id} commission={commission} />
          ))}
        </>
      )}
    </>
  );
}