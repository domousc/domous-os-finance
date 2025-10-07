import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface ClientService {
  id: string;
  service_id: string;
  custom_price: number | null;
  cycles: number;
  start_date: string;
  status: string;
  services: {
    title: string;
    price: number;
    billing_cycle: string | null;
  };
}

interface ClientServicesSectionProps {
  clientId: string;
  onAddService: () => void;
}

export function ClientServicesSection({
  clientId,
  onAddService,
}: ClientServicesSectionProps) {
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel("client-services-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_services",
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("client_services")
        .select(
          `
          *,
          services (
            title,
            price,
            billing_cycle
          )
        `
        )
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar serviços",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este serviço?")) return;

    try {
      const { error } = await supabase
        .from("client_services")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Serviço removido",
        description: "Serviço removido com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover serviço",
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Serviços Vinculados</CardTitle>
        <Button onClick={onAddService}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Serviço
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Carregando...</div>
        ) : services.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum serviço vinculado
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    {service.services.title}
                  </TableCell>
                  <TableCell>
                    R$ {(service.custom_price || service.services.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {service.services.billing_cycle === "monthly"
                      ? "Mensal"
                      : service.services.billing_cycle === "annual"
                      ? "Anual"
                      : "Pagamento único"}
                  </TableCell>
                  <TableCell>{service.cycles}</TableCell>
                  <TableCell>
                    {format(new Date(service.start_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        service.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {service.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
