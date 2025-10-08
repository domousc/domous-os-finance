import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface MemberPaymentGroupProps {
  member: any;
  payments: any[];
  onRefetch: () => void;
}

export const MemberPaymentGroup = ({ member, payments, onRefetch }: MemberPaymentGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = payments.filter(p => p.status === 'paid').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await supabase
        .from("team_payments")
        .update({
          status: "paid",
          paid_date: new Date().toISOString(),
        })
        .eq("id", paymentId);

      toast.success("Pagamento marcado como pago!");
      onRefetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-lg">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
          <Badge variant={member.employment_type === 'fixed' ? 'default' : 'secondary'}>
            {member.employment_type === 'fixed' ? 'Fixo' : 'Variável'}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(totalAmount)}</p>
            <p className="text-sm text-muted-foreground">
              {paidCount} de {payments.length} pagos
            </p>
          </div>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{payment.description}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={payment.payment_type === 'salary' ? 'default' : 'outline'}>
                    {payment.payment_type === 'salary' ? 'Salário' : 'Serviço'}
                  </Badge>
                  <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                    {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(Number(payment.amount))}</p>
                  <p className="text-sm text-muted-foreground">
                    Vencimento: {format(new Date(payment.due_date), "dd/MM/yyyy")}
                  </p>
                </div>

                {payment.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsPaid(payment.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar Pago
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
