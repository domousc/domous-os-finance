import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { PayableItem } from "./PayableItemsTable";
import { PayableItemDialog } from "./PayableItemDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PayableItemRowProps {
  item: PayableItem;
  onUpdate: () => void;
}

export function PayableItemRow({ item, onUpdate }: PayableItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      overdue: { label: "Atrasado", variant: "destructive" },
      paid: { label: "Pago", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "outline" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryDisplay = () => {
    if (item.type === "commission") {
      return <Badge variant="default">Comissão</Badge>;
    }
    
    if (item.type === "team_payment") {
      const paymentTypeMap: Record<string, string> = {
        salary: "Salário",
        bonus: "Bonificação",
        commission: "Comissão",
        other: "Outro",
      };
      const displayText = item.paymentType 
        ? paymentTypeMap[item.paymentType] || item.paymentType
        : "Pagamento";
      return <Badge variant="outline">{displayText}</Badge>;
    }
    
    const categoryMap: Record<string, string> = {
      subscription: "Assinatura",
      team: "Time",
      service: "Serviço",
      other: "Outro",
    };
    
    const displayText = item.category 
      ? categoryMap[item.category] || item.category
      : "Despesa";
    
    return <Badge variant="secondary">{displayText}</Badge>;
  };

  const handleMarkAsPaid = async () => {
    try {
      setUpdating(true);
      
      if (item.type === "commission") {
        const { error } = await supabase
          .from("partner_commissions")
          .update({
            status: "paid",
            paid_date: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;
      } else if (item.type === "team_payment") {
        const { error } = await supabase
          .from("team_payments")
          .update({
            status: "paid",
            paid_date: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_expenses")
          .update({
            status: "paid",
            paid_date: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;
      }

      toast({
        title: "Marcado como pago",
        description: "O item foi atualizado com sucesso.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  const isOverdue = item.status === "pending" && new Date(item.dueDate) < new Date();
  const isPaid = item.status === "paid";

  return (
    <>
      <TableRow className={isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""}>
        <TableCell>
          <Checkbox
            checked={isPaid}
            disabled={isPaid || updating}
            onCheckedChange={(checked) => {
              if (checked) handleMarkAsPaid();
            }}
          />
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{item.description}</TableCell>
        <TableCell>{getCategoryDisplay()}</TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">{item.notes || "-"}</span>
        </TableCell>
        <TableCell>
          {format(item.dueDate, "dd/MM/yyyy", { locale: ptBR })}
        </TableCell>
        <TableCell>{getStatusBadge(item.status)}</TableCell>
        <TableCell className="text-right font-medium">
          {item.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className={isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""}>
          <TableCell colSpan={9} className="bg-muted/50">
            <div className="py-4 px-6 space-y-3">
              {item.type === "commission" && item.commissionDetails && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Parceiro:</span>
                    <span>{item.partnerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Pagamento previsto:</span>
                    <span>
                      {format(item.commissionDetails.scheduledPaymentDate, "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2">Clientes indicados:</p>
                    <div className="space-y-1">
                      {item.commissionDetails.clients.map((client, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm pl-4">
                          <span>
                            • {client.name} - {client.invoice_number}
                          </span>
                          <span className="font-medium">
                            {client.amount.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold mt-2 pt-2 border-t">
                      <span>Total: {item.commissionDetails.clients.length} cliente(s)</span>
                      <span>
                        {item.amount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {item.type === "team_payment" && (
                <div className="space-y-2 text-sm">
                  {item.teamMemberName && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Membro:</span>
                      <span>{item.teamMemberName}</span>
                    </div>
                  )}
                  {item.paymentType && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Tipo:</span>
                      <Badge variant="outline">
                        {item.paymentType === "salary" && "Salário"}
                        {item.paymentType === "bonus" && "Bonificação"}
                        {item.paymentType === "commission" && "Comissão"}
                        {item.paymentType === "other" && "Outro"}
                      </Badge>
                    </div>
                  )}
                  {item.referenceMonth && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Referência:</span>
                      <span>
                        {new Date(item.referenceMonth).toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  {item.salarySnapshot && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Salário base:</span>
                      <span>
                        {item.salarySnapshot.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}
                  {item.paymentMethod && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Método de pagamento:</span>
                      <span>{item.paymentMethod}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Notas:</span>
                      <span className="text-muted-foreground">{item.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {item.type === "expense" && (
                <div className="space-y-2 text-sm">
                  {item.category && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Categoria:</span>
                      <span>{item.category}</span>
                    </div>
                  )}
                  {item.billingCycle && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Recorrência:</span>
                      <Badge variant="outline">
                        {item.billingCycle === "monthly" && "Mensal"}
                        {item.billingCycle === "annual" && "Anual"}
                        {item.billingCycle === "one_time" && "Única"}
                      </Badge>
                    </div>
                  )}
                  {item.paymentMethod && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Método de pagamento:</span>
                      <span>{item.paymentMethod}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Notas:</span>
                      <span className="text-muted-foreground">{item.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}

      <PayableItemDialog
        item={item}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
