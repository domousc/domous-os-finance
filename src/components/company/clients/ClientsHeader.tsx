import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";

interface ClientsHeaderProps {
  onNewClient: () => void;
  onImport: () => void;
}

export function ClientsHeader({ onNewClient, onImport }: ClientsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Clientes</h2>
        <p className="text-muted-foreground">Gerencie seus clientes</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
        <Button onClick={onNewClient}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
    </div>
  );
}
