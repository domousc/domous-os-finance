import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  payment_method: string | null;
  companies: { id: string; name: string } | null;
  plans: { id: string; name: string; billing_period: string } | null;
}

interface SubscriptionsTableProps {
  onEditSubscription: (subscriptionId: string) => void;
}

const statusConfig = {
  trial: { label: "Trial", variant: "secondary" as const, color: "bg-blue-500" },
  active: { label: "Ativo", variant: "default" as const, color: "bg-green-500" },
  pending: { label: "Pendente", variant: "outline" as const, color: "bg-yellow-500" },
  cancelled: { label: "Cancelado", variant: "destructive" as const, color: "bg-red-500" },
  expired: { label: "Expirado", variant: "outline" as const, color: "bg-gray-500" },
};

export const SubscriptionsTable = ({ onEditSubscription }: SubscriptionsTableProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        companies (id, name),
        plans (id, name, billing_period)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar assinaturas",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSubscriptions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();

    const channel = supabase
      .channel("subscriptions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
        },
        () => {
          fetchSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("subscriptions").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir assinatura",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Assinatura excluída com sucesso",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 animate-in fade-in-50 duration-300">
        <div className="animate-pulse text-muted-foreground">
          Carregando assinaturas...
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg animate-in fade-in-50 duration-300">
        <p className="text-muted-foreground text-lg">
          Nenhuma assinatura cadastrada
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Clique em "Nova Assinatura" para começar
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border animate-in fade-in-50 duration-500">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data de Início</TableHead>
            <TableHead>Data de Término</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => {
            const statusInfo = statusConfig[subscription.status as keyof typeof statusConfig] || statusConfig.pending;
            
            return (
              <TableRow
                key={subscription.id}
                className="hover-scale transition-all duration-200"
              >
                <TableCell className="font-medium">
                  {subscription.companies?.name || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{subscription.plans?.name || "-"}</span>
                    <span className="text-xs text-muted-foreground">
                      {subscription.plans?.billing_period === "monthly" ? "Mensal" : "Anual"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant} className="gap-1">
                    <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(subscription.start_date), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {subscription.end_date
                    ? format(new Date(subscription.end_date), "dd/MM/yyyy", { locale: ptBR })
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditSubscription(subscription.id)}
                      className="hover-scale"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover-scale">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta assinatura? Esta ação
                            não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(subscription.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
