import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Handshake, ExternalLink, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface PersonPayableGroupProps {
  personId: string;
  personName: string;
  personType: "team_member" | "partner";
  payments: PayableItem[];
  totalAmount: number;
  onUpdate: () => void;
}

export function PersonPayableGroup({
  personId,
  personName,
  personType,
  payments,
  totalAmount,
  onUpdate,
}: PersonPayableGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPaymentTypeBadge = (item: PayableItem) => {
    if (item.type === "team_payment") {
      const typeMap: Record<string, string> = {
        salary: "Salário",
        bonus: "Bonificação",
        commission: "Comissão",
        other: "Outro",
      };
      return typeMap[item.paymentType || "other"] || "Pagamento";
    }
    if (item.type === "commission") return "Comissão";
    return "Despesa";
  };

  const isOverdue = (dueDate: Date) => {
    return dueDate < new Date();
  };

  const handlePayAll = async () => {
    setIsPaying(true);
    try {
      const now = new Date().toISOString();

      // Separate payments by type
      const teamPayments = payments.filter(p => p.type === "team_payment");
      const commissions = payments.filter(p => p.type === "commission");

      // Update team payments
      if (teamPayments.length > 0) {
        const { error: teamError } = await supabase
          .from("team_payments")
          .update({ status: "paid", paid_date: now })
          .in("id", teamPayments.map(p => p.id));

        if (teamError) throw teamError;
      }

      // Update partner commissions
      if (commissions.length > 0) {
        const { error: commissionError } = await supabase
          .from("partner_commissions")
          .update({ status: "paid", paid_date: now })
          .in("id", commissions.map(p => p.id));

        if (commissionError) throw commissionError;
      }

      toast({
        title: "Pagamentos realizados",
        description: `${payments.length} pagamento(s) de ${personName} marcado(s) como pago(s).`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error paying all:", error);
      toast({
        title: "Erro ao processar pagamentos",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  const nextDueDate = payments.reduce((earliest, payment) => {
    return !earliest || payment.dueDate < earliest ? payment.dueDate : earliest;
  }, null as Date | null);

  const profileLink = personType === "team_member" 
    ? "/dashboard/team" 
    : `/dashboard/partners/${personId}`;

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {personType === "team_member" ? (
              <Users className="h-5 w-5 text-primary" />
            ) : (
              <Handshake className="h-5 w-5 text-primary" />
            )}
            <div>
              <h3 className="font-semibold text-lg">{personName}</h3>
              <p className="text-sm text-muted-foreground">
                {payments.length} pagamento(s) • {personType === "team_member" ? "Equipe" : "Parceiro"}
                {nextDueDate && ` • Próximo: ${format(nextDueDate, "dd/MM/yyyy", { locale: ptBR })}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            {nextDueDate && isOverdue(nextDueDate) && (
              <Badge variant="destructive" className="mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                Atrasado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getPaymentTypeBadge(payment)}</Badge>
                    <span className="font-medium">{payment.description}</span>
                  </div>
                  {payment.referenceMonth && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Ref: {format(payment.referenceMonth, "MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className={isOverdue(payment.dueDate) ? "text-destructive font-medium" : ""}>
                      {format(payment.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" asChild className="flex-1">
              <Link to={profileLink}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Perfil
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex-1" disabled={isPaying}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pagar Todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar pagamento múltiplo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja marcar <strong>{payments.length} pagamento(s)</strong> de{" "}
                    <strong>{personName}</strong> como pagos?
                    <br />
                    <br />
                    Total: <strong>{formatCurrency(totalAmount)}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePayAll}>
                    Confirmar Pagamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
