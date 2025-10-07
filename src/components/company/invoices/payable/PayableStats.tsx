import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export function PayableStats() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["payable-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select("status, commission_amount");

      if (error) throw error;

      const pending = data
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const paid = data
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const cancelled = data
        .filter((c) => c.status === "cancelled")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);

      const total = data.reduce((sum, c) => sum + Number(c.commission_amount), 0);

      return {
        total,
        pending,
        paid,
        cancelled,
        pendingCount: data.filter((c) => c.status === "pending").length,
        paidCount: data.filter((c) => c.status === "paid").length,
      };
    },
    enabled: !!user,
  });

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.total || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de comissões geradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.pending || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.pendingCount || 0} comissões pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.paid || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.paidCount || 0} comissões pagas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.cancelled || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Comissões canceladas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
