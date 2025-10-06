import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionExpired() {
  const navigate = useNavigate();
  const { subscription, plan, status } = useSubscription();
  const { hasRole, isSuperAdmin, loading: roleLoading } = useRole();
  const { signOut } = useAuth();

  // Superadmin nunca deve ver esta página
  useEffect(() => {
    if (!roleLoading && isSuperAdmin) {
      navigate("/superadmin");
    }
  }, [roleLoading, isSuperAdmin, navigate]);

  // Loading state
  if (roleLoading) {
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

  const handleBackToLogin = async () => {
    await signOut();
    navigate("/login");
  };

  const canRenew = hasRole("admin") || hasRole("gestor");

  const getMessage = () => {
    if (status === "canceled") {
      return "Sua assinatura foi cancelada.";
    }
    if (status === "expired") {
      return "Sua assinatura expirou.";
    }
    return "Você não possui uma assinatura ativa.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>{getMessage()}</AlertDescription>
          </Alert>

          {plan && (
            <div className="space-y-2">
              <h3 className="font-medium">Último Plano</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plano:</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-medium">R$ {plan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Período:
                  </span>
                  <span className="font-medium">
                    {plan.billing_period === "monthly" ? "Mensal" : "Anual"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {canRenew ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Para continuar usando o sistema, você precisa renovar sua
                  assinatura. Escolha um plano que melhor atende às suas
                  necessidades.
                </p>
                <Button
                  onClick={() => navigate("/dashboard/plans")}
                  className="w-full"
                  size="lg"
                >
                  Renovar Assinatura
                </Button>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  Entre em contato com o administrador da sua empresa para
                  renovar a assinatura.
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={handleBackToLogin}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Deslogar e Voltar
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Precisa de ajuda?{" "}
              <a href="mailto:suporte@domousos.com" className="text-primary hover:underline">
                Entre em contato com o suporte
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
