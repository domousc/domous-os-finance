import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PayableItem } from "./PayableItemsTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PayableItemDialogProps {
  item: PayableItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function PayableItemDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
}: PayableItemDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const tableName = item.type === "commission" ? "partner_commissions" : "company_expenses";
      
      const { error } = await supabase
        .from(tableName)
        .update({
          status: "paid",
          paid_date: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${item.type === "commission" ? "Comissão" : "Despesa"} marcada como paga`,
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error marking as paid:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (item.type !== "commission") return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("partner_commissions")
        .update({ status: "cancelled" })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Comissão cancelada",
        description: "A comissão foi cancelada com sucesso",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error canceling commission:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.description}
            <Badge variant={item.type === "commission" ? "default" : "secondary"}>
              {item.type === "commission" ? "Comissão" : "Despesa"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do item a pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="space-y-3">
            <h3 className="font-semibold">Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <p className="font-semibold text-lg">
                  {item.amount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Vencimento:</span>
                <p className="font-medium">
                  {format(item.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium">{item.status}</p>
              </div>
              {item.paymentMethod && (
                <div>
                  <span className="text-muted-foreground">Método de pagamento:</span>
                  <p className="font-medium">{item.paymentMethod}</p>
                </div>
              )}
            </div>
          </div>

          {/* Detalhes específicos de Comissão */}
          {item.type === "commission" && item.commissionDetails && (
            <div className="space-y-3">
              <h3 className="font-semibold">Detalhes da Comissão</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Parceiro:</span>
                  <p className="font-medium">{item.partnerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pagamento previsto:</span>
                  <p className="font-medium">
                    {format(item.commissionDetails.scheduledPaymentDate, "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="mt-4">
                  <span className="text-muted-foreground block mb-2">Clientes indicados:</span>
                  <div className="border rounded-md divide-y">
                    {item.commissionDetails.clients.map((client, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Fatura: {client.invoice_number}
                          </p>
                        </div>
                        <span className="font-semibold">
                          {client.amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detalhes específicos de Despesa */}
          {item.type === "expense" && (
            <div className="space-y-3">
              <h3 className="font-semibold">Detalhes da Despesa</h3>
              <div className="space-y-2 text-sm">
                {item.category && (
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <p className="font-medium">{item.category}</p>
                  </div>
                )}
                {item.billingCycle && (
                  <div>
                    <span className="text-muted-foreground">Tipo de recorrência:</span>
                    <p className="font-medium">
                      {item.billingCycle === "monthly" && "Mensal"}
                      {item.billingCycle === "annual" && "Anual"}
                      {item.billingCycle === "one_time" && "Única"}
                    </p>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <span className="text-muted-foreground">Observações:</span>
                    <p className="font-medium mt-1">{item.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {item.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                {item.type === "commission" && (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancelar Comissão
                  </Button>
                )}
                <Button onClick={handleMarkAsPaid} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Marcar como Pago
                </Button>
              </>
            )}
            {item.status !== "pending" && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
