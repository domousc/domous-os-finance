import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompaniesHeaderProps {
  onCreateCompany: () => void;
}

export const CompaniesHeader = ({ onCreateCompany }: CompaniesHeaderProps) => {
  return (
    <div className="flex items-center justify-between animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as empresas do sistema
          </p>
        </div>
      </div>
      <Button onClick={onCreateCompany} className="gap-2 hover-scale">
        <Plus className="h-4 w-4" />
        Nova Empresa
      </Button>
    </div>
  );
};
