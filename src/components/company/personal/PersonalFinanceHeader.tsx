import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PersonalFinanceHeaderProps {
  onAddTransaction: () => void;
}

export const PersonalFinanceHeader = ({ onAddTransaction }: PersonalFinanceHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Controle Pessoal</h1>
        <p className="text-muted-foreground">
          Gerencie suas contas a pagar e receber de forma privada e organizada
        </p>
      </div>
      <Button onClick={onAddTransaction}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Transação
      </Button>
    </div>
  );
};
