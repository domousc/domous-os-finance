import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseInstallmentRow } from "./ExpenseInstallmentRow";

interface Expense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  current_installment: number;
  payment_method: string | null;
  notes: string | null;
  category: string | null;
}

interface ExpenseInstallmentsDropdownProps {
  installments: Expense[];
}

export function ExpenseInstallmentsDropdown({
  installments,
}: ExpenseInstallmentsDropdownProps) {
  const sortedInstallments = [...installments].sort(
    (a, b) => (a.current_installment || 1) - (b.current_installment || 1)
  );

  return (
    <div className="p-4">
      <div className="mb-2 px-4">
        <h4 className="font-semibold text-sm">Parcelas</h4>
      </div>
      <div className="border rounded-lg bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcela</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInstallments.map((installment) => (
              <ExpenseInstallmentRow
                key={installment.id}
                installment={installment}
                totalInstallments={installments.length}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
