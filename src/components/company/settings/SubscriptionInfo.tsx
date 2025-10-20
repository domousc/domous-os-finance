import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Users, FileBarChart, AlertCircle } from "lucide-react";
import { PlanFeatures } from "./PlanFeatures";

export const SubscriptionInfo = () => {
  const { subscription, plan, status, daysRemaining } = useSubscription();

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "default";
      case "trial":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "active":
        return "Ativa";
      case "trial":
        return "Trial";
      case "expired":
        return "Expirada";
      case "canceled":
        return "Cancelada";
      default:
        return "Sem assinatura";
    }
  };

  return (
    <div className="space-y-4">
      {status === "trial" && daysRemaining !== null && daysRemaining <= 7 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seu período de trial expira em {daysRemaining}{" "}
            {daysRemaining === 1 ? "dia" : "dias"}. Considere renovar sua assinatura.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 space-y-0">
            <CardTitle className="text-xs font-medium">Status da Assinatura</CardTitle>
            <Badge variant={getStatusColor()} className="text-[10px] px-2 py-0">
              {getStatusLabel()}
            </Badge>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{plan?.name || "N/A"}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {plan?.description || "Nenhum plano ativo"}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 space-y-0">
            <CardTitle className="text-xs font-medium">Plano Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              R$ {plan?.price?.toFixed(2) || "0.00"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              por {plan?.billing_period === "monthly" ? "mês" : "ano"}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 space-y-0">
            <CardTitle className="text-xs font-medium">Limite de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">0 / {plan?.max_users || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">usuários ativos</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md md:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 space-y-0">
            <CardTitle className="text-xs font-medium">
              {status === "trial" ? "Dias Restantes" : "Próxima Cobrança"}
            </CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {status === "trial"
                ? daysRemaining || 0
                : subscription?.end_date
                ? new Date(subscription.end_date).toLocaleDateString("pt-BR")
                : "N/A"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {status === "trial" ? "dias de trial" : "data de renovação"}
            </p>
          </CardContent>
        </Card>
      </div>

      {plan?.features && plan.features.length > 0 && <PlanFeatures features={plan.features} />}
    </div>
  );
};
