import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface ClientService {
  id: string;
  custom_price: number | null;
  cycles: number;
  start_date: string;
  first_due_date: string | null;
  service_id: string;
  services: {
    billing_cycle: string;
  } | null;
}

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  cpf: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  client_services: ClientService[];
  totalPaid?: number;
}

interface ClientsTableProps {
  onEditClient: (client: Client) => void;
}

export function ClientsTable({ onEditClient }: ClientsTableProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();

    const channel = supabase
      .channel("clients-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          client_services (
            id,
            custom_price,
            cycles,
            start_date,
            first_due_date,
            service_id,
            services (
              billing_cycle
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch paid totals for each client
      const clientsWithTotals = await Promise.all(
        (data || []).map(async (client) => {
          const { data: invoices } = await supabase
            .from("invoices")
            .select("amount")
            .eq("client_id", client.id)
            .eq("status", "paid");

          const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
          
          return {
            ...client,
            totalPaid,
          };
        })
      );

      setClients(clientsWithTotals as any);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientToDelete);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: "Cliente excluído com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir cliente",
        description: error.message,
      });
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleToggleStatus = async (clientId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      const { error } = await supabase
        .from("clients")
        .update({ status: newStatus })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Cliente ${newStatus === "active" ? "ativado" : "desativado"} com sucesso`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message,
      });
    }
  };

  const getPaymentDay = (client: Client) => {
    if (client.client_services && client.client_services.length > 0) {
      const firstService = client.client_services[0];
      const dueDate = firstService.first_due_date || firstService.start_date;
      return new Date(dueDate).getDate();
    }
    return "-";
  };

  const getMonthlyValue = (client: Client) => {
    if (client.client_services && client.client_services.length > 0) {
      return client.client_services[0].custom_price || 0;
    }
    return 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Dia Pgto</TableHead>
                <TableHead>Mensalidades</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Total Pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhum cliente cadastrado
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client: any) => {
                const monthlyValue = getMonthlyValue(client);
                const paymentDay = getPaymentDay(client);
                const cycles = client.client_services?.[0]?.cycles || "-";
                const startDate = client.client_services?.[0]?.start_date 
                  ? new Date(client.client_services[0].start_date).toLocaleDateString("pt-BR")
                  : "-";

                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {formatCurrency(monthlyValue)}
                      </span>
                    </TableCell>
                    <TableCell>{paymentDay}</TableCell>
                    <TableCell>{cycles}</TableCell>
                    <TableCell className="text-sm">{startDate}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(client.totalPaid || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(client.id, client.status)}
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer transition-colors hover:opacity-80 ${
                          client.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {client.status === "active" ? "Ativo" : "Inativo"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClient(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setClientToDelete(client.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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
}
