import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ExpenseInstallmentsDropdown } from "./ExpenseInstallmentsDropdown";

interface Expense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  current_installment: number;
  total_installments: number;
  payment_method: string | null;
  notes: string | null;
  category: string | null;
}

interface GroupedExpense {
  installmentGroupId: string;
  description: string;
  category: string | null;
  installments: Expense[];
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  nextDueDate: string | null;
}

interface ExpenseGroupRowProps {
  group: GroupedExpense;
}

export function ExpenseGroupRow({ group }: ExpenseGroupRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getGeneralStatus = () => {
    if (group.overdueCount > 0) {
      return { label: "Atrasado", variant: "destructive" as const };
    }
    if (group.paidCount === group.installments.length) {
      return { label: "Pago", variant: "default" as const };
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
        <TableCell>
          <Badge variant="secondary" className="mr-2">
            Despesa
          </Badge>
        </TableCell>
        <TableCell className="font-medium">
          {group.description}
          <span className="ml-2 text-xs text-muted-foreground">
            ({group.paidCount}/{group.installments.length})
          </span>
        </TableCell>
        <TableCell>
          {group.nextDueDate ? (
            <span className="text-sm">
              {new Date(group.nextDueDate).toLocaleDateString("pt-BR")}
            </span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell>
          <Badge variant={status.variant}>{status.label}</Badge>
        </TableCell>
        <TableCell className="text-right">
          R$ {group.totalAmount.toFixed(2)}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-0 bg-muted/20">
            <ExpenseInstallmentsDropdown installments={group.installments} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
