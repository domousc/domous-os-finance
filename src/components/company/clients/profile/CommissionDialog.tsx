import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  sales_amount: z.string().min(1, "Valor de vendas é obrigatório"),
  commission_percentage: z.string().min(1, "Porcentagem é obrigatória"),
  reference_month: z.date({
    required_error: "Mês de referência é obrigatório",
  }),
  notes: z.string().optional(),
});

interface CommissionDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

export function CommissionDialog({
  open,
  onClose,
  clientId,
  onSuccess,
}: CommissionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sales_amount: "",
      commission_percentage: "",
      reference_month: new Date(),
      notes: "",
    },
  });

  const salesAmount = form.watch("sales_amount");
  const commissionPercentage = form.watch("commission_percentage");

  const calculateCommission = () => {
    const sales = parseFloat(salesAmount) || 0;
    const percentage = parseFloat(commissionPercentage) || 0;
    return (sales * percentage / 100).toFixed(2);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const salesAmount = parseFloat(values.sales_amount);
      const commissionPercentage = parseFloat(values.commission_percentage);
      const commissionAmount = salesAmount * commissionPercentage / 100;

      const referenceMonth = format(values.reference_month, "yyyy-MM-dd");

      // Insert commission record
      const { data: commission, error: commissionError } = await supabase
        .from("commissions")
        .insert({
          company_id: profile.company_id,
          client_id: clientId,
          sales_amount: salesAmount,
          commission_percentage: commissionPercentage,
          commission_amount: commissionAmount,
          reference_month: referenceMonth,
          notes: values.notes,
        })
        .select()
        .single();

      if (commissionError) throw commissionError;

      // Generate invoice number
      const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
        .rpc("generate_invoice_number", { company_uuid: profile.company_id });

      if (invoiceNumberError) throw invoiceNumberError;

      // Create invoice
      const dueDate = new Date(values.reference_month);
      dueDate.setMonth(dueDate.getMonth() + 1);

      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          company_id: profile.company_id,
          client_id: clientId,
          invoice_number: invoiceNumberData,
          amount: commissionAmount,
          due_date: dueDate.toISOString(),
          status: "pending",
          notes: `Comissão - ${values.notes || "Ref: " + format(values.reference_month, "MM/yyyy")}`,
          cycle_number: 1,
          client_service_id: null,
          service_id: null,
        });

      if (invoiceError) throw invoiceError;

      // Update commission with invoice reference
      await supabase
        .from("commissions")
        .update({ invoice_id: commission.id })
        .eq("id", commission.id);

      toast({
        title: "Comissão registrada!",
        description: `Valor calculado: R$ ${commissionAmount.toFixed(2)}`,
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar comissão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Comissão de Vendas</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reference_month"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Mês de Referência</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione o mês</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sales_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total de Vendas (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentagem de Comissão (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {salesAmount && commissionPercentage && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor a Receber</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {calculateCommission()}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar e Gerar Fatura
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
