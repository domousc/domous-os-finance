import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PartnerCommissionsProps {
  partnerId: string;
}

export function PartnerCommissions({ partnerId }: PartnerCommissionsProps) {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["partner-commissions", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select(`
          *,
          clients (
            name,
            company_name
          )
        `)
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Carregando...</div>;

  const totalPending = commissions?.filter(c => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
  
  const totalPaid = commissions?.filter(c => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comissões</CardTitle>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-sm text-muted-foreground">Pendente</p>
            <p className="text-xl font-bold">
              {totalPending.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pago</p>
            <p className="text-xl font-bold">
              {totalPaid.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Mês Ref.</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pag.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions?.map((commission) => (
              <TableRow key={commission.id}>
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
                <TableCell className="font-medium">
                  {Number(commission.commission_amount).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      commission.status === "paid"
                        ? "default"
                        : commission.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {commission.status === "paid"
                      ? "Pago"
                      : commission.status === "pending"
                      ? "Pendente"
                      : "Cancelado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {commission.paid_date
                    ? format(new Date(commission.paid_date), "dd/MM/yyyy")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
            {!commissions?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma comissão gerada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
