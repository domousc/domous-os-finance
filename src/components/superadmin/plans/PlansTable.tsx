import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
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
import { Card } from "@/components/ui/card";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: "monthly" | "semiannual" | "annual";
  status: "active" | "inactive";
  features: any;
  max_users: number;
}

interface PlansTableProps {
  onEditPlan: (planId: string) => void;
}

const billingPeriodLabels = {
  monthly: "Mensal",
  semiannual: "Semestral",
  annual: "Anual",
};

export const PlansTable = ({ onEditPlan }: PlansTableProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar planos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();

    const channel = supabase
      .channel("plans-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "plans",
        },
        () => {
          fetchPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteClick = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      const { error } = await supabase
        .from("plans")
        .delete()
        .eq("id", planToDelete);

      if (error) throw error;

      toast({
        title: "Plano excluído",
        description: "O plano foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-pulse-slow text-muted-foreground">
            Carregando planos...
          </div>
        </div>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="p-12 text-center animate-in fade-in-50 duration-500">
        <p className="text-muted-foreground text-lg">
          Nenhum plano cadastrado ainda.
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Clique em "Novo Plano" para criar o primeiro plano.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Valor</TableHead>
              <TableHead className="font-semibold">Período</TableHead>
              <TableHead className="font-semibold">Usuários Máx.</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan, index) => (
              <TableRow
                key={plan.id}
                className="group hover:bg-muted/50 transition-colors duration-200 animate-in fade-in-50 slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{plan.name}</div>
                    {plan.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-primary">
                    R$ {plan.price.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-medium">
                    {billingPeriodLabels[plan.billing_period]}
                  </Badge>
                </TableCell>
                <TableCell>{plan.max_users}</TableCell>
                <TableCell>
                  <Badge
                    variant={plan.status === "active" ? "default" : "secondary"}
                    className="transition-all duration-200"
                  >
                    {plan.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover-scale"
                      onClick={() => onEditPlan(plan.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover-scale text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este plano? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
