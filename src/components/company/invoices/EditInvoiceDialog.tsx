import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
}

interface EditInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const formSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  discount_type: z.enum(["none", "percentage", "fixed"]),
  discount_value: z.string().optional(),
});

export function EditInvoiceDialog({
  open,
  onClose,
  invoice,
}: EditInvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      due_date: "",
      discount_type: "none",
      discount_value: "",
    },
  });

  useEffect(() => {
    if (invoice && open) {
      form.reset({
        amount: invoice.amount.toString(),
        due_date: format(new Date(invoice.due_date), "yyyy-MM-dd"),
        discount_type: "none",
        discount_value: "",
      });
    }
  }, [invoice, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!invoice) return;

    try {
      setLoading(true);

      let finalAmount = parseFloat(values.amount);

      // Aplicar desconto se houver
      if (values.discount_type !== "none" && values.discount_value) {
        const discountValue = parseFloat(values.discount_value);
        
        if (values.discount_type === "percentage") {
          // Desconto em percentual
          if (discountValue < 0 || discountValue > 100) {
            toast({
              variant: "destructive",
              title: "Erro",
              description: "Percentual de desconto deve estar entre 0 e 100",
            });
            return;
          }
          finalAmount = finalAmount - (finalAmount * discountValue / 100);
        } else {
          // Desconto em valor fixo
          if (discountValue < 0 || discountValue > finalAmount) {
            toast({
              variant: "destructive",
              title: "Erro",
              description: "Desconto não pode ser maior que o valor total",
            });
            return;
          }
          finalAmount = finalAmount - discountValue;
        }
      }

      const { error } = await supabase
        .from("invoices")
        .update({
          amount: finalAmount,
          due_date: new Date(values.due_date).toISOString(),
        })
        .eq("id", invoice.id);

      if (error) throw error;

      toast({
        title: "Fatura atualizada",
        description: "Fatura atualizada com sucesso",
      });

      form.reset();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar fatura",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const discountType = form.watch("discount_type");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Fatura</DialogTitle>
          <DialogDescription>
            Fatura: {invoice?.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Original</FormLabel>
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
              name="discount_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Desconto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem desconto</SelectItem>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {discountType !== "none" && (
              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Valor do Desconto {discountType === "percentage" ? "(%)" : "(R$)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={discountType === "percentage" ? "0-100" : "0.00"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
