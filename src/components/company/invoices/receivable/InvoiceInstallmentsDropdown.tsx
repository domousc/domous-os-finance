import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InstallmentRow } from "./InstallmentRow";

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

interface InvoiceInstallmentsDropdownProps {
  installments: Invoice[];
}

export function InvoiceInstallmentsDropdown({
  installments,
}: InvoiceInstallmentsDropdownProps) {
  const sortedInstallments = [...installments].sort(
    (a, b) => a.cycle_number - b.cycle_number
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
              <TableHead>Número da Fatura</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInstallments.map((installment) => (
              <InstallmentRow
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
