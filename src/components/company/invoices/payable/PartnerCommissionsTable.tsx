import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { PayCommissionDialog } from "./PayCommissionDialog";

export function PartnerCommissionsTable() {
  const { user } = useAuth();
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);

  const { data: commissions, isLoading } = useQuery({
    queryKey: ["partner-commissions-payable", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select(`
          *,
          partners (
            name,
            pix_key,
            bank_name,
            bank_agency,
            bank_account
          ),
          clients (
            name,
            company_name
          )
        `)
        .order("reference_month", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handlePayClick = (commission: any) => {
    setSelectedCommission(commission);
    setPayDialogOpen(true);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const pending = commissions?.filter(c => c.status === "pending") || [];
  const paid = commissions?.filter(c => c.status === "paid") || [];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Pendentes</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Dados Pag.</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">
                      {commission.partners?.name}
                    </TableCell>
                    <TableCell>
                      {commission.clients?.company_name || commission.clients?.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(commission.reference_month), "MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {Number(commission.base_amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell>{commission.commission_percentage}%</TableCell>
                    <TableCell className="font-bold">
                      {Number(commission.commission_amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {commission.partners?.pix_key && (
                        <div>PIX: {commission.partners.pix_key}</div>
                      )}
                      {commission.partners?.bank_name && (
                        <div>
                          {commission.partners.bank_name} - 
                          Ag: {commission.partners.bank_agency} - 
                          Cc: {commission.partners.bank_account}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handlePayClick(commission)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Pagar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!pending.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhuma comissão pendente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Pagas</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Data Pag.</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paid.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">
                      {commission.partners?.name}
                    </TableCell>
                    <TableCell>
                      {commission.clients?.company_name || commission.clients?.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(commission.reference_month), "MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-bold">
                      {Number(commission.commission_amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell>
                      {commission.paid_date
                        ? format(new Date(commission.paid_date), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>{commission.payment_method || "-"}</TableCell>
                    <TableCell>
                      <Badge>Pago</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!paid.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma comissão paga
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <PayCommissionDialog
        open={payDialogOpen}
        onClose={() => {
          setPayDialogOpen(false);
          setSelectedCommission(null);
        }}
        commission={selectedCommission}
      />
    </>
  );
}
