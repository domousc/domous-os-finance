import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const expenseSchema = z.object({
  type: z.enum(["subscription", "service", "infrastructure", "others", "one_time"]),
  category: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  billing_cycle: z.enum(["monthly", "annual", "one_time"]),
  due_date: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  is_installment: z.boolean().optional(),
  installments: z.string().optional(),
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
  const [isInstallment, setIsInstallment] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: "subscription",
      billing_cycle: "monthly",
      category: "",
      description: "",
      amount: "",
      due_date: new Date(),
      payment_method: "",
      notes: "",
      is_installment: false,
      installments: "1",
    },
  });

  useEffect(() => {
    if (expense) {
      setIsInstallment(expense.total_installments > 1);
      form.reset({
        type: expense.type,
        category: expense.category || "",
        description: expense.description,
        amount: expense.total_installments > 1 ? expense.total_amount.toString() : expense.amount.toString(),
        billing_cycle: expense.billing_cycle,
        due_date: new Date(expense.due_date),
        payment_method: expense.payment_method || "",
        notes: expense.notes || "",
        is_installment: expense.total_installments > 1,
        installments: expense.total_installments.toString(),
      });
    } else {
      setIsInstallment(false);
      form.reset({
        type: "subscription",
        billing_cycle: "monthly",
        category: "",
        description: "",
        amount: "",
        due_date: new Date(),
        payment_method: "",
        notes: "",
        is_installment: false,
        installments: "1",
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

      const totalAmount = parseFloat(data.amount);
      const installments = data.is_installment ? parseInt(data.installments || "1") : 1;
      const installmentAmount = totalAmount / installments;

      if (expense) {
        // Se está editando e é parcelado, só permite editar a parcela atual
        const expenseData = {
          company_id: profile.company_id,
          type: data.type,
          category: data.category || null,
          description: data.description,
          amount: parseFloat(data.amount),
          billing_cycle: data.billing_cycle,
          due_date: data.due_date.toISOString(),
          payment_method: data.payment_method || null,
          notes: data.notes || null,
        };

        const { error } = await supabase
          .from("company_expenses")
          .update(expenseData)
          .eq("id", expense.id);
        if (error) throw error;
      } else {
        // Criar nova despesa
        const installmentGroupId = installments > 1 ? crypto.randomUUID() : null;
        const firstDueDate = data.due_date;

        const expensesToCreate = [];
        
        for (let i = 0; i < installments; i++) {
          const currentDueDate = new Date(firstDueDate);
          currentDueDate.setMonth(currentDueDate.getMonth() + i);

            // Determinar status inicial baseado na data, tipo e método de pagamento
            const isPastDue = currentDueDate <= new Date();
            const shouldBePaid = isPastDue && (data.type === "subscription" || 
                                               data.payment_method === "Cartão de Crédito");
            
            expensesToCreate.push({
              company_id: profile.company_id,
              type: data.type,
              category: data.category || null,
              description: installments > 1 ? `${data.description} (${i + 1}/${installments})` : data.description,
              amount: installmentAmount,
              total_amount: totalAmount,
              billing_cycle: data.billing_cycle,
              due_date: currentDueDate.toISOString(),
              payment_method: data.payment_method || null,
              notes: data.notes || null,
              status: shouldBePaid ? "paid" : "pending",
              paid_date: shouldBePaid ? new Date().toISOString() : null,
              installment_group_id: installmentGroupId,
              total_installments: installments,
              current_installment: i + 1,
            });
        }

        const { error } = await supabase
          .from("company_expenses")
          .insert(expensesToCreate);
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
                        <SelectItem value="others">Outros</SelectItem>
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
                  <FormLabel>Detalhes (Opcional)</FormLabel>
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
                    <FormLabel>{isInstallment ? "Valor Total" : "Valor"}</FormLabel>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
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
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
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
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="installment-mode"
                checked={isInstallment}
                onCheckedChange={(checked) => {
                  setIsInstallment(checked);
                  form.setValue("is_installment", checked);
                  if (!checked) {
                    form.setValue("installments", "1");
                  }
                }}
                disabled={!!expense}
              />
              <label
                htmlFor="installment-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Parcelar despesa
              </label>
            </div>

            {isInstallment && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2"
                        max="60"
                        placeholder="Ex: 12"
                        {...field}
                        disabled={!!expense}
                      />
                    </FormControl>
                    {field.value && parseFloat(form.watch("amount") || "0") > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {parseInt(field.value)}x de{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(parseFloat(form.watch("amount")) / parseInt(field.value))}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="PIX/Boleto">PIX/Boleto</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
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
