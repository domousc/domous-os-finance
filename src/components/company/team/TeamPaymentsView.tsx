import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MemberPaymentGroup } from "./MemberPaymentGroup";
import { TeamPaymentDialog } from "./TeamPaymentDialog";
import { Period, calculateFutureDateRange } from "@/lib/dateFilters";

interface TeamPaymentsViewProps {
  period: Period;
}

export const TeamPaymentsView = ({ period }: TeamPaymentsViewProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data: paymentsGrouped, refetch } = useQuery({
    queryKey: ["team-payments-grouped", period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("No company");

      // Auto-generate salaries if none exist for current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const { data: existingSalaries } = await supabase
        .from("team_payments")
        .select("id")
        .eq("company_id", profile.company_id)
        .eq("payment_type", "salary")
        .gte("reference_month", currentMonth.toISOString().split('T')[0])
        .limit(1);

      if (!existingSalaries || existingSalaries.length === 0) {
        await supabase.rpc("generate_monthly_salaries");
      }

      // Buscar todos os pagamentos (sem filtro de data) para garantir que apareçam
      const { data: payments } = await supabase
        .from("team_payments")
        .select(`
          *,
          team_member:team_members(*)
        `)
        .eq("company_id", profile.company_id)
        .order("due_date", { ascending: false });

      // Agrupar por membro
      const grouped = payments?.reduce((acc: any, payment: any) => {
        const memberId = payment.team_member_id;
        if (!acc[memberId]) {
          acc[memberId] = {
            member: payment.team_member,
            payments: [],
          };
        }
        acc[memberId].payments.push(payment);
        return acc;
      }, {});

      return Object.values(grouped || {});
    },
  });

  const handleCloseDialog = () => {
    setSelectedPayment(null);
    setIsDialogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pagamentos da Equipe</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pagamento
        </Button>
      </div>

      <div className="space-y-4">
        {!paymentsGrouped || paymentsGrouped.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum pagamento encontrado. Adicione um novo pagamento para começar.
          </div>
        ) : (
          paymentsGrouped.map((group: any) => (
            <MemberPaymentGroup
              key={group.member.id}
              member={group.member}
              payments={group.payments}
              onRefetch={refetch}
            />
          ))
        )}
      </div>

      <TeamPaymentDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        payment={selectedPayment}
      />
    </div>
  );
};
