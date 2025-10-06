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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  service_type: "subscription" | "one_time" | "recurring";
  billing_cycle: "monthly" | "quarterly" | "semiannual" | "annual" | null;
  status: "active" | "inactive" | "archived";
  company_id: string | null;
  companies?: {
    name: string;
  } | null;
}

interface ServicesTableProps {
  onEdit: (service: Service) => void;
  refreshTrigger: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

const formatBillingCycle = (cycle: string | null) => {
  if (!cycle) return "-";
  const cycles: Record<string, string> = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
  };
  return cycles[cycle] || cycle;
};

const getTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    subscription: "Assinatura",
    one_time: "Único",
    recurring: "Recorrente",
  };
  return types[type] || type;
};

const getTypeBadgeVariant = (type: string) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    subscription: "default",
    one_time: "secondary",
    recurring: "outline",
  };
  return variants[type] || "outline";
};

const getStatusBadgeVariant = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    active: "default",
    inactive: "secondary",
    archived: "outline",
  };
  return variants[status] || "outline";
};

const getStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    archived: "Arquivado",
  };
  return statuses[status] || status;
};

export const ServicesTable = ({ onEdit, refreshTrigger }: ServicesTableProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          companies (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar a lista de serviços",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [refreshTrigger]);

  useEffect(() => {
    const channel = supabase
      .channel("services-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Serviço excluído",
        description: "O serviço foi removido com sucesso",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o serviço",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Nenhum serviço cadastrado
        </p>
        <p className="text-sm text-muted-foreground">
          Clique em "Novo Serviço" para começar
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{service.title}</span>
                    {service.description && (
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {service.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {service.companies?.name || "Sem empresa"}
                </TableCell>
                <TableCell>
                  <Badge variant={getTypeBadgeVariant(service.service_type)}>
                    {getTypeLabel(service.service_type)}
                  </Badge>
                </TableCell>
                <TableCell>{formatPrice(service.price)}</TableCell>
                <TableCell>{formatBillingCycle(service.billing_cycle)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(service.status)}>
                    {getStatusLabel(service.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
