import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PersonPayableGroup } from "./PersonPayableGroup";
import { PersonPayableFilters } from "./PersonPayableFilters";
import { Loader2 } from "lucide-react";
import { calculateFutureDateRange } from "@/lib/dateFilters";
import type { Period } from "@/components/shared/PeriodFilter";

interface PayableItem {
  id: string;
  type: "commission" | "expense" | "team_payment";
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
  paymentType?: string;
  referenceMonth?: Date;
}

interface PersonPayableData {
  personId: string;
  personName: string;
  personType: "team_member" | "partner";
  totalAmount: number;
  payments: PayableItem[];
  nextDueDate: Date;
}

interface PersonPayableViewProps {
  period: Period;
}

export function PersonPayableView({ period }: PersonPayableViewProps) {
  const [personData, setPersonData] = useState<PersonPayableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [personType, setPersonType] = useState<"all" | "team_member" | "partner">("all");
  const [sortBy, setSortBy] = useState<"amount" | "name" | "due_date">("amount");
  const { user } = useAuth();

  const fetchPersonPayables = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const dateRange = calculateFutureDateRange(period);
      
      // Fetch team payments
      let teamQuery = supabase
        .from("team_payments")
        .select(`
          *,
          team_members (
            id,
            name
          )
        `)
        .eq("status", "pending");

      if (period !== "all" && dateRange.start && dateRange.end) {
        teamQuery = teamQuery
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const { data: teamPayments, error: teamError } = await teamQuery;
      if (teamError) throw teamError;

      // Fetch partner commissions
      let commissionQuery = supabase
        .from("partner_commissions")
        .select(`
          *,
          partners (
            id,
            name
          )
        `)
        .eq("status", "pending");

      if (period !== "all" && dateRange.start && dateRange.end) {
        commissionQuery = commissionQuery
          .gte("scheduled_payment_date", dateRange.start.toISOString().split("T")[0])
          .lte("scheduled_payment_date", dateRange.end.toISOString().split("T")[0]);
      }

      const { data: commissions, error: commissionError } = await commissionQuery;
      if (commissionError) throw commissionError;

      // Group by person
      const personMap = new Map<string, PersonPayableData>();

      // Process team payments
      teamPayments?.forEach((payment: any) => {
        const personId = payment.team_member_id;
        const personName = payment.team_members?.name || "Membro Desconhecido";
        
        if (!personMap.has(personId)) {
          personMap.set(personId, {
            personId,
            personName,
            personType: "team_member",
            totalAmount: 0,
            payments: [],
            nextDueDate: new Date(payment.due_date),
          });
        }

        const person = personMap.get(personId)!;
        const dueDate = new Date(payment.due_date);
        
        person.payments.push({
          id: payment.id,
          type: "team_payment",
          description: payment.description,
          amount: payment.amount,
          dueDate,
          status: payment.status,
          paymentType: payment.payment_type,
          referenceMonth: payment.reference_month ? new Date(payment.reference_month) : undefined,
        });
        
        person.totalAmount += payment.amount;
        if (dueDate < person.nextDueDate) {
          person.nextDueDate = dueDate;
        }
      });

      // Process partner commissions
      commissions?.forEach((commission: any) => {
        const personId = commission.partner_id;
        const personName = commission.partners?.name || "Parceiro Desconhecido";
        
        if (!personMap.has(personId)) {
          personMap.set(personId, {
            personId,
            personName,
            personType: "partner",
            totalAmount: 0,
            payments: [],
            nextDueDate: new Date(commission.scheduled_payment_date),
          });
        }

        const person = personMap.get(personId)!;
        const dueDate = new Date(commission.scheduled_payment_date);
        
        person.payments.push({
          id: commission.id,
          type: "commission",
          description: commission.notes || `Comissão - ${commission.commission_percentage}%`,
          amount: commission.commission_amount,
          dueDate,
          status: commission.status,
          referenceMonth: commission.reference_month ? new Date(commission.reference_month) : undefined,
        });
        
        person.totalAmount += commission.commission_amount;
        if (dueDate < person.nextDueDate) {
          person.nextDueDate = dueDate;
        }
      });

      setPersonData(Array.from(personMap.values()));
    } catch (error) {
      console.error("Error fetching person payables:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonPayables();

    // Setup realtime subscriptions
    const channel = supabase
      .channel("person-payables-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_payments" },
        () => fetchPersonPayables()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_commissions" },
        () => fetchPersonPayables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, period]);

  // Filter and sort
  const filteredData = personData
    .filter((person) => personType === "all" || person.personType === personType)
    .sort((a, b) => {
      if (sortBy === "amount") return b.totalAmount - a.totalAmount;
      if (sortBy === "name") return a.personName.localeCompare(b.personName);
      if (sortBy === "due_date") return a.nextDueDate.getTime() - b.nextDueDate.getTime();
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum pagamento pendente para pessoas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PersonPayableFilters
        personType={personType}
        onPersonTypeChange={(value) => setPersonType(value)}
        sortBy={sortBy}
        onSortByChange={(value) => setSortBy(value)}
      />

      <div className="space-y-4">
        {filteredData.map((person) => (
          <PersonPayableGroup
            key={person.personId}
            personId={person.personId}
            personName={person.personName}
            personType={person.personType}
            payments={person.payments}
            totalAmount={person.totalAmount}
            onUpdate={fetchPersonPayables}
          />
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {filteredData.length} pessoa(s) com pagamentos pendentes
        </p>
        <p className="text-lg font-semibold">
          Total: {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(filteredData.reduce((sum, person) => sum + person.totalAmount, 0))}
        </p>
      </div>
    </div>
  );
}
