import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Percent, TrendingDown, DollarSign } from "lucide-react";
import type { Period } from "@/components/shared/PeriodFilter";
import { calculateDateRange } from "@/lib/dateFilters";

interface TaxCalculationProps {
  period: Period;
  customRange?: { from: Date; to: Date };
}

export function TaxCalculation({ period, customRange }: TaxCalculationProps) {
  const { user } = useAuth();
  const baseRange = calculateDateRange(period);
  const dateRange = customRange?.from && customRange?.to && period === "custom"
    ? { start: customRange.from, end: customRange.to }
    : baseRange;

  const { data: receivedData } = useQuery({
    queryKey: ["tax-calculation", user?.id, period, customRange],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("amount, paid_date")
        .eq("status", "paid");

      if (dateRange.start && dateRange.end) {
        query = query
          .gte("paid_date", dateRange.start.toISOString())
          .lte("paid_date", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalReceived = (data || []).reduce((sum, inv) => sum + Number(inv.amount), 0);

      // Cálculo de impostos baseado em alíquotas aproximadas
      // Simples Nacional - faixa 1 (até R$ 180k/ano) - aproximadamente 6%
      const simplesNacional = totalReceived * 0.06;
      
      // ISS (Imposto Sobre Serviços) - aproximadamente 2% a 5% - usando 3%
      const iss = totalReceived * 0.03;
      
      // INSS (se aplicável) - aproximadamente 11%
      const inss = totalReceived * 0.11;
      
      // Imposto de Renda (se aplicável) - cálculo progressivo simplificado
      // Usando alíquota média de 15% sobre o lucro estimado (30% do faturamento)
      const lucroEstimado = totalReceived * 0.3;
      const ir = lucroEstimado * 0.15;

      const totalTaxes = simplesNacional + iss;
      const netAmount = totalReceived - totalTaxes;

      return {
        totalReceived,
        simplesNacional,
        iss,
        inss,
        ir,
        totalTaxes,
        netAmount,
      };
    },
    enabled: !!user,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatPercentage = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cálculo de Impostos</h2>
        <p className="text-sm text-muted-foreground">
          Cálculo automático baseado no recebimento do período
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <Receipt className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receivedData?.totalReceived || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faturas pagas no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simples Nacional</CardTitle>
            <Percent className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(receivedData?.simplesNacional || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(6)} do faturamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ISS</CardTitle>
            <Percent className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(receivedData?.iss || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(3)} do faturamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(receivedData?.netAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Após impostos ({formatCurrency(receivedData?.totalTaxes || 0)})
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento dos Impostos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Simples Nacional (6%)</span>
            </div>
            <span className="text-sm font-bold">{formatCurrency(receivedData?.simplesNacional || 0)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">ISS (3%)</span>
            </div>
            <span className="text-sm font-bold">{formatCurrency(receivedData?.iss || 0)}</span>
          </div>
          <div className="flex items-center justify-between py-2 pt-3 border-t-2">
            <span className="text-sm font-bold">Total de Impostos</span>
            <span className="text-lg font-bold text-destructive">
              {formatCurrency(receivedData?.totalTaxes || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 bg-muted/30 rounded-lg px-3">
            <span className="text-sm font-bold">Valor Líquido Final</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(receivedData?.netAmount || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="font-medium mb-2">ℹ️ Informações sobre o cálculo:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Os valores são calculados automaticamente baseado nas faturas <strong>pagas</strong> no período selecionado</li>
          <li>Simples Nacional: alíquota de 6% (faixa 1, até R$ 180k/ano)</li>
          <li>ISS: alíquota de 3% sobre serviços prestados</li>
          <li>Estes são valores estimados. Consulte seu contador para informações precisas</li>
        </ul>
      </div>
    </div>
  );
}
