import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { MemberPaymentGroup } from "./MemberPaymentGroup";
import { TeamPaymentDialog } from "./TeamPaymentDialog";
import { Period, getDateRangeFilter } from "@/lib/dateFilters";
import { toast } from "sonner";

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

      const dateFilter = getDateRangeFilter(period);

      const { data: payments } = await supabase
        .from("team_payments")
        .select(`
          *,
          team_member:team_members(*)
        `)
        .eq("company_id", profile.company_id)
        .gte("due_date", dateFilter.start)
        .lte("due_date", dateFilter.end)
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

  const handleGenerateSalaries = async () => {
    try {
      const { data, error } = await supabase.rpc("generate_monthly_salaries");
      
      if (error) throw error;

      if (data === 0) {
        toast.info("Nenhum salário novo para gerar");
      } else {
        toast.success(`${data} salário(s) gerado(s) com sucesso!`);
        refetch();
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCloseDialog = () => {
    setSelectedPayment(null);
    setIsDialogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pagamentos</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateSalaries}>
            <Calendar className="h-4 w-4 mr-2" />
            Gerar Salários do Mês
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pagamento
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {paymentsGrouped?.map((group: any) => (
          <MemberPaymentGroup
            key={group.member.id}
            member={group.member}
            payments={group.payments}
            onRefetch={refetch}
          />
        ))}
      </div>

      <TeamPaymentDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        payment={selectedPayment}
      />
    </div>
  );
};
