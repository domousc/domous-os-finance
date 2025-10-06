import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlansHeaderProps {
  onCreatePlan: () => void;
}

export const PlansHeader = ({ onCreatePlan }: PlansHeaderProps) => {
  return (
    <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Gerenciar Planos
        </h1>
        <p className="text-muted-foreground mt-1">
          Crie e gerencie os planos de assinatura
        </p>
      </div>
      <Button
        onClick={onCreatePlan}
        className="gap-2 hover-scale transition-all duration-200"
        size="lg"
      >
        <Plus className="w-5 h-5" />
        Novo Plano
      </Button>
    </div>
  );
};
