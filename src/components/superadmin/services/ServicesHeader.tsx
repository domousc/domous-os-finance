import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ServicesHeaderProps {
  onNewService: () => void;
}

export const ServicesHeader = ({ onNewService }: ServicesHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie serviços e assinaturas da plataforma
        </p>
      </div>
      <Button onClick={onNewService} className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Serviço
      </Button>
    </div>
  );
};
