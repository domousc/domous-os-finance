import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRole } from "@/contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Users, FileBarChart } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const { subscription, plan, status, daysRemaining, loading, hasActiveSubscription } =
    useSubscription();

  // Superadmin deve ser redirecionado para o painel de superadmin
  useEffect(() => {
    if (!roleLoading && isSuperAdmin) {
      navigate("/superadmin", { replace: true });
    }
  }, [roleLoading, isSuperAdmin, navigate]);

  // Usuários normais sem assinatura ativa são redirecionados
  useEffect(() => {
    console.log("[Dashboard] Checking subscription redirect:", { 
      roleLoading, 
      isSuperAdmin, 
      loading, 
      hasActiveSubscription 
    });
    
    // CRITICAL: Só redireciona após TODOS os loadings terminarem
    if (!roleLoading && !isSuperAdmin && !loading && !hasActiveSubscription) {
      console.log("[Dashboard] Redirecting to subscription-expired");
      navigate("/dashboard/subscription-expired");
    }
  }, [roleLoading, isSuperAdmin, loading, hasActiveSubscription, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se for superadmin, não renderiza nada (será redirecionado)
  if (isSuperAdmin) {
    return null;
  }

  if (!hasActiveSubscription) {
    return null;
  }

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
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Painel de Gestão"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de gestão
          </p>
        </div>

        {status === "trial" && daysRemaining !== null && daysRemaining <= 7 && (
          <Alert>
            <AlertDescription>
              Seu período de trial expira em {daysRemaining}{" "}
              {daysRemaining === 1 ? "dia" : "dias"}. Considere renovar sua
              assinatura.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Status da Assinatura
              </CardTitle>
              <Badge variant={getStatusColor()}>{getStatusLabel()}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plan?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">
                {plan?.description || "Nenhum plano ativo"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {plan?.price?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                por {plan?.billing_period === "monthly" ? "mês" : "ano"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Limite de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0 / {plan?.max_users || 0}
              </div>
              <p className="text-xs text-muted-foreground">usuários ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {status === "trial" ? "Dias Restantes" : "Próxima Cobrança"}
              </CardTitle>
              <FileBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status === "trial"
                  ? daysRemaining || 0
                  : subscription?.end_date
                  ? new Date(subscription.end_date).toLocaleDateString("pt-BR")
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {status === "trial" ? "dias" : "data de renovação"}
              </p>
            </CardContent>
          </Card>
        </div>

        {plan?.features && plan.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recursos do Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature: any, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
