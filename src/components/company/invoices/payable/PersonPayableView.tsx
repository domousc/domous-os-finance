import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PersonPayableGroup } from "./PersonPayableGroup";
import { PersonPayableFilters } from "./PersonPayableFilters";
import { Loader2 } from "lucide-react";
import { calculateFutureDateRange } from "@/lib/dateFilters";
import type { Period } from "@/components/shared/PeriodFilter";

interface PersonPayableItem {
  id: string;
  type: "commission" | "team";
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
}

interface PersonPayableData {
  personId: string;
  personName: string;
  personType: "team_member" | "partner";
  totalAmount: number;
  payments: PersonPayableItem[];
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
      
      let query = supabase
        .from("payables")
        .select(`
          *,
          team_members (id, name),
          partners (id, name)
        `)
        .eq("status", "pending")
        .in("type", ["team", "commission"]);

      if (dateRange.start && dateRange.end) {
        query = query
          .gte("due_date", dateRange.start.toISOString())
          .lte("due_date", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by person
      const personMap = new Map<string, PersonPayableData>();

      data?.forEach((item: any) => {
        let personId: string;
        let personName: string;
        let personType: "team_member" | "partner";

        if (item.type === "team" && item.team_member_id) {
          personId = item.team_member_id;
          personName = item.team_members?.name || "Membro Desconhecido";
          personType = "team_member";
        } else if (item.type === "commission" && item.partner_id) {
          personId = item.partner_id;
          personName = item.partners?.name || "Parceiro Desconhecido";
          personType = "partner";
        } else {
          return;
        }

        if (!personMap.has(personId)) {
          personMap.set(personId, {
            personId,
            personName,
            personType,
            totalAmount: 0,
            payments: [],
            nextDueDate: new Date(item.due_date),
          });
        }

        const person = personMap.get(personId)!;
        const dueDate = new Date(item.due_date);
        
        person.payments.push({
          id: item.id,
          type: item.type,
          description: item.description,
          amount: Number(item.amount),
          dueDate,
          status: item.status,
        });
        
        person.totalAmount += Number(item.amount);
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

    const channel = supabase
      .channel("person-payables-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payables" },
        () => fetchPersonPayables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, period]);

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
