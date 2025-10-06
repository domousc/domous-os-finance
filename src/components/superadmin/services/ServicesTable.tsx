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
  billing_cycle: "monthly" | "annual" | "semiannual" | null;
  status: "active" | "inactive" | "archived";
  company_id: string | null;
  companies?: {
    name: string;
  };
}

interface ServicesTableProps {
  onEdit: (service: Service) => void;
  onDataChange?: () => void;
}

export const ServicesTable = ({ onEdit, onDataChange }: ServicesTableProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
      onDataChange?.();
    } catch (error: any) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel("services_changes")
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
      const { error } = await supabase.from("services").delete().eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir serviço",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      subscription: "Assinatura",
      one_time: "Único",
      recurring: "Recorrente",
    };
    return labels[type] || type;
  };

  const getCycleLabel = (cycle: string | null) => {
    if (!cycle) return "-";
    const labels: Record<string, string> = {
      monthly: "Mensal",
      annual: "Anual",
      semiannual: "Semestral",
    };
    return labels[cycle] || cycle;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      inactive: "secondary",
      archived: "outline",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      inactive: "Inativo",
      archived: "Arquivado",
    };
    return (
      <Badge variant={variants[status]}>{labels[status] || status}</Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      subscription: "default",
      one_time: "secondary",
      recurring: "outline",
    };
    return <Badge variant={variants[type]}>{getTypeLabel(type)}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
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
                <TableCell className="font-medium">{service.title}</TableCell>
                <TableCell>{service.companies?.name || "-"}</TableCell>
                <TableCell>{getTypeBadge(service.service_type)}</TableCell>
                <TableCell>{formatPrice(service.price)}</TableCell>
                <TableCell>{getCycleLabel(service.billing_cycle)}</TableCell>
                <TableCell>{getStatusBadge(service.status)}</TableCell>
                <TableCell className="text-right space-x-2">
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
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
