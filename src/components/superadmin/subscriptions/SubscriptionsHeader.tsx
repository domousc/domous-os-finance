import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionsHeaderProps {
  onCreateSubscription: () => void;
}

export const SubscriptionsHeader = ({ onCreateSubscription }: SubscriptionsHeaderProps) => {
  return (
    <div className="flex items-center justify-between animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assinaturas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as assinaturas das empresas
        </p>
      </div>
      <Button onClick={onCreateSubscription} className="gap-2">
        <Plus className="h-4 w-4" />
        Nova Assinatura
      </Button>
    </div>
  );
};
