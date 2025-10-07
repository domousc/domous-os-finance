import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

interface PartnerAgreementsProps {
  partnerId: string;
  onAddAgreement: () => void;
}

export function PartnerAgreements({ partnerId, onAddAgreement }: PartnerAgreementsProps) {
  const { data: agreements, isLoading } = useQuery({
    queryKey: ["partner-agreements", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_client_agreements")
        .select(`
          *,
          clients (
            name,
            company_name
          )
        `)
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Acordos com Clientes</CardTitle>
          <Button size="sm" onClick={onAddAgreement}>
            <Plus className="h-4 w-4 mr-2" />
            Vincular Cliente
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements?.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell>
                  {agreement.clients?.company_name || agreement.clients?.name}
                </TableCell>
                <TableCell>{agreement.commission_percentage}%</TableCell>
                <TableCell>
                  {format(new Date(agreement.start_date), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  {agreement.end_date
                    ? format(new Date(agreement.end_date), "dd/MM/yyyy")
                    : "Indeterminado"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={agreement.status === "active" ? "default" : "secondary"}
                  >
                    {agreement.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!agreements?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum acordo cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
