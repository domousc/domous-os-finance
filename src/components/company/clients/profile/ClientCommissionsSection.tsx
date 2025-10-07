import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Percent } from "lucide-react";
import { CommissionDialog } from "./CommissionDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Commission {
  id: string;
  sales_amount: number;
  commission_percentage: number;
  commission_amount: number;
  reference_month: string;
  notes: string | null;
  created_at: string;
}

interface ClientCommissionsSectionProps {
  clientId: string;
}

export function ClientCommissionsSection({ clientId }: ClientCommissionsSectionProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .eq("client_id", clientId)
        .order("reference_month", { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [clientId]);

  if (loading) {
    return <div>Carregando comissões...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Comissões de Vendas</h2>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Comissão
        </Button>
      </div>

      {commissions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhuma comissão registrada ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {commissions.map((commission) => (
            <div
              key={commission.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {format(new Date(commission.reference_month), "MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>Vendas: R$ {commission.sales_amount.toFixed(2)}</p>
                    <p>Comissão: {commission.commission_percentage}%</p>
                    {commission.notes && <p className="italic">{commission.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor a Receber</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {commission.commission_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CommissionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clientId={clientId}
        onSuccess={fetchCommissions}
      />
    </Card>
  );
}
