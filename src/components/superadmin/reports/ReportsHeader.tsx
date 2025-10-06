import { BarChart3, TrendingUp } from "lucide-react";

export const ReportsHeader = () => {
  return (
    <div className="flex items-center justify-between animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Relatórios e Análises
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Acompanhe o desempenho do sistema em tempo real
          </p>
        </div>
      </div>
    </div>
  );
};
