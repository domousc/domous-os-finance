import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const expenseSchema = z.object({
  type: z.enum(["subscription", "service", "infrastructure", "marketing", "team", "one_time"]),
  category: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  billing_cycle: z.enum(["monthly", "annual", "one_time"]),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: any;
}

export const ExpenseDialog = ({ open, onOpenChange, expense }: ExpenseDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: "subscription",
      billing_cycle: "monthly",
      category: "",
      description: "",
      amount: "",
      due_date: "",
      payment_method: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        type: expense.type,
        category: expense.category || "",
        description: expense.description,
        amount: expense.amount.toString(),
        billing_cycle: expense.billing_cycle,
        due_date: new Date(expense.due_date).toISOString().split("T")[0],
        payment_method: expense.payment_method || "",
        notes: expense.notes || "",
      });
    } else {
      form.reset({
        type: "subscription",
        billing_cycle: "monthly",
        category: "",
        description: "",
        amount: "",
        due_date: "",
        payment_method: "",
        notes: "",
      });
    }
  }, [expense, form]);

  const mutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      const expenseData = {
        company_id: profile.company_id,
        type: data.type,
        category: data.category || null,
        description: data.description,
        amount: parseFloat(data.amount),
        billing_cycle: data.billing_cycle,
        due_date: new Date(data.due_date).toISOString(),
        payment_method: data.payment_method || null,
        notes: data.notes || null,
        status: "pending" as const,
      };

      if (expense) {
        const { error } = await supabase
          .from("company_expenses")
          .update(expenseData)
          .eq("id", expense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_expenses")
          .insert(expenseData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-expenses"] });
      toast({
        title: expense ? "Despesa atualizada" : "Despesa criada",
        description: expense
          ? "Despesa atualizada com sucesso!"
          : "Nova despesa adicionada com sucesso!",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao salvar despesa: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descreva a despesa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="subscription">Assinatura</SelectItem>
                        <SelectItem value="service">Serviço</SelectItem>
                        <SelectItem value="infrastructure">Infraestrutura</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="team">Equipe</SelectItem>
                        <SelectItem value="one_time">Pontual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciclo de Cobrança</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="one_time">Única</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: AWS, Google Ads, Domínio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cartão de Crédito, PIX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Informações adicionais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
