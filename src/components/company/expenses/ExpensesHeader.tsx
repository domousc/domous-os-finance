import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExpensesHeaderProps {
  onAddExpense: () => void;
}

export const ExpensesHeader = ({ onAddExpense }: ExpensesHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Despesas Operacionais</h1>
        <p className="text-muted-foreground">
          Gerencie assinaturas, serviços, infraestrutura e outras despesas da empresa
        </p>
      </div>
      <Button onClick={onAddExpense}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Despesa
      </Button>
    </div>
  );
};
