import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, TrendingDown, Users, Package } from "lucide-react";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FileText,
      label: "Nova Fatura",
      description: "Criar fatura para cliente",
      onClick: () => navigate("/dashboard/clients"),
    },
    {
      icon: TrendingDown,
      label: "Nova Despesa",
      description: "Registrar despesa operacional",
      onClick: () => navigate("/dashboard/finance/expenses"),
    },
    {
      icon: Users,
      label: "Gerenciar Equipe",
      description: "Adicionar pagamentos da equipe",
      onClick: () => navigate("/dashboard/finance/team"),
    },
    {
      icon: Package,
      label: "Ver Detalhes",
      description: "Visão completa do financeiro",
      onClick: () => navigate("/dashboard/finance/overview"),
    },
  ];

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-accent transition-colors"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4 mb-2 text-primary" />
              <div className="text-left">
                <div className="text-xs font-semibold">{action.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
