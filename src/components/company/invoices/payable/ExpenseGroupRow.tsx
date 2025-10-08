import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ExpenseInstallmentsDropdown } from "./ExpenseInstallmentsDropdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  notes: string | null;
  installments: Expense[];
  totalAmount: number;
  totalInstallments: number;
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
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const getGeneralStatus = () => {
    if (group.overdueCount > 0) {
      return { label: "Atrasado", variant: "destructive" as const };
    }
    if (group.paidCount === group.totalInstallments) {
      return { label: "Pago", variant: "default" as const };
    }
    return { label: "Em Dia", variant: "outline" as const };
  };

  const getCategoryDisplay = () => {
    const categoryMap: Record<string, string> = {
      subscription: "Assinatura",
      team: "Time",
      service: "Serviço",
      other: "Outro",
    };
    
    const displayText = group.category 
      ? categoryMap[group.category] || group.category
      : "Despesa";
    
    return <Badge variant="secondary">{displayText}</Badge>;
  };

  const handleMarkAllAsPaid = async () => {
    try {
      setUpdating(true);
      
      // Buscar IDs das parcelas pendentes/atrasadas
      const pendingInstallments = group.installments.filter(
        (inst) => inst.status === "pending" || inst.status === "overdue"
      );

      if (pendingInstallments.length === 0) {
        toast({
          title: "Nenhuma parcela pendente",
          description: "Todas as parcelas já foram pagas.",
        });
        return;
      }

      const { error } = await supabase
        .from("company_expenses")
        .update({
          status: "paid",
          paid_date: new Date().toISOString(),
        })
        .in("id", pendingInstallments.map((i) => i.id));

      if (error) throw error;

      toast({
        title: "Parcelas marcadas como pagas",
        description: `${pendingInstallments.length} parcela(s) atualizada(s) com sucesso.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar parcelas",
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  const status = getGeneralStatus();
  const allPaid = group.paidCount === group.installments.length;

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <Checkbox
            checked={allPaid}
            disabled={allPaid || updating}
            onCheckedChange={(checked) => {
              if (checked) handleMarkAllAsPaid();
            }}
          />
        </TableCell>
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
        <TableCell className="font-medium">
          {group.description}
          <span className="ml-2 text-xs text-muted-foreground">
            ({group.paidCount}/{group.totalInstallments})
          </span>
        </TableCell>
        <TableCell>{getCategoryDisplay()}</TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">{group.notes || "-"}</span>
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
          <TableCell colSpan={9} className="p-0 bg-muted/20">
            <ExpenseInstallmentsDropdown installments={group.installments} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
