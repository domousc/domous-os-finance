import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PartnersHeaderProps {
  onNewPartner: () => void;
}

export function PartnersHeader({ onNewPartner }: PartnersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parceiros</h2>
        <p className="text-muted-foreground">
          Gerencie seus parceiros e comissões
        </p>
      </div>
      <Button onClick={onNewPartner}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Parceiro
      </Button>
    </div>
  );
}
