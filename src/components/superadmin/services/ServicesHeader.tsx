import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ServicesHeaderProps {
  onAddService: () => void;
}

export const ServicesHeader = ({ onAddService }: ServicesHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground">
          Gerencie serviços, assinaturas e produtos recorrentes
        </p>
      </div>
      <Button onClick={onAddService} className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Serviço
      </Button>
    </div>
  );
};
