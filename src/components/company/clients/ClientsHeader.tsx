import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ClientsHeaderProps {
  onNewClient: () => void;
}

export function ClientsHeader({ onNewClient }: ClientsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Clientes</h2>
        <p className="text-muted-foreground">Gerencie seus clientes</p>
      </div>
      <Button onClick={onNewClient}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Cliente
      </Button>
    </div>
  );
}
