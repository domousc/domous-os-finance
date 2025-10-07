import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PartnerCommissionGroupRow } from "./PartnerCommissionGroupRow";

interface Commission {
  id: string;
  commission_amount: number;
  base_amount: number;
  commission_percentage: number;
  reference_month: string;
  status: string;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  partner_id: string;
  client_id: string;
}

interface Partner {
  name: string;
  pix_key: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
}

interface Client {
  name: string;
  company_name: string | null;
}

interface CommissionWithRelations extends Commission {
  partners: Partner;
  clients: Client;
}

interface GroupedCommission {
  partnerId: string;
  partner: Partner;
  commissions: CommissionWithRelations[];
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  cancelledCount: number;
}

export function PartnerCommissionsTable() {
  const [groupedCommissions, setGroupedCommissions] = useState<GroupedCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCommissions();

    const channel = supabase
      .channel("commissions-payable-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_commissions" },
        () => {
          fetchCommissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCommissions = async () => {
    try {
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

      // Group by partner_id
      const grouped = (data as CommissionWithRelations[]).reduce((acc, commission) => {
        const key = commission.partner_id;
        if (!acc[key]) {
          acc[key] = {
            partnerId: key,
            partner: commission.partners,
            commissions: [],
            totalAmount: 0,
            pendingCount: 0,
            paidCount: 0,
            cancelledCount: 0,
          };
        }

        acc[key].commissions.push(commission);
        acc[key].totalAmount += Number(commission.commission_amount);

        // Count status
        if (commission.status === "pending") acc[key].pendingCount++;
        else if (commission.status === "paid") acc[key].paidCount++;
        else if (commission.status === "cancelled") acc[key].cancelledCount++;

        return acc;
      }, {} as Record<string, GroupedCommission>);

      setGroupedCommissions(Object.values(grouped));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar comissões",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Parceiro</TableHead>
            <TableHead>Dados Pagamento</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Comissões</TableHead>
            <TableHead>Status Geral</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedCommissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhuma comissão encontrada
              </TableCell>
            </TableRow>
          ) : (
            groupedCommissions.map((group) => (
              <PartnerCommissionGroupRow key={group.partnerId} group={group} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
