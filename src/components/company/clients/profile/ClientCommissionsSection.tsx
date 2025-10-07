import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Percent, Pencil, Trash2 } from "lucide-react";
import { CommissionDialog } from "./CommissionDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Commission {
  id: string;
  sales_amount: number;
  commission_percentage: number;
  commission_amount: number;
  reference_month: string;
  notes: string | null;
  created_at: string;
  invoice_id: string | null;
}

interface ClientCommissionsSectionProps {
  clientId: string;
}

export function ClientCommissionsSection({ clientId }: ClientCommissionsSectionProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commissionToDelete, setCommissionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleEdit = (commission: Commission) => {
    setEditingCommission(commission);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!commissionToDelete) return;

    try {
      // First, get the commission to find associated invoice
      const { data: commission } = await supabase
        .from("commissions")
        .select("invoice_id")
        .eq("id", commissionToDelete)
        .single();

      // Delete the commission
      const { error: commissionError } = await supabase
        .from("commissions")
        .delete()
        .eq("id", commissionToDelete);

      if (commissionError) throw commissionError;

      // If there's an associated invoice, delete it too
      if (commission?.invoice_id) {
        await supabase
          .from("invoices")
          .delete()
          .eq("id", commission.invoice_id);
      }

      toast({
        title: "Comissão excluída",
        description: "A comissão e sua fatura foram removidas com sucesso.",
      });

      fetchCommissions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir comissão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCommissionToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCommission(null);
  };

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
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
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
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-muted-foreground">Valor a Receber</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {commission.commission_amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(commission)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCommissionToDelete(commission.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CommissionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        clientId={clientId}
        onSuccess={() => {
          fetchCommissions();
          handleCloseDialog();
        }}
        commission={editingCommission}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta comissão? A fatura associada também será removida. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
