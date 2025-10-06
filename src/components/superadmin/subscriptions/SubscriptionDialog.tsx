import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  company_id: z.string().min(1, "Selecione uma empresa"),
  plan_id: z.string().min(1, "Selecione um plano"),
  status: z.enum(["trial", "active", "pending", "cancelled", "expired"]),
  start_date: z.date({ required_error: "Data de início é obrigatória" }),
  end_date: z.date().optional(),
  trial_end_date: z.date().optional(),
  payment_method: z.string().optional(),
}).refine((data) => {
  if (data.end_date && data.start_date) {
    return data.end_date > data.start_date;
  }
  return true;
}, {
  message: "Data de término deve ser maior que data de início",
  path: ["end_date"],
});

interface SubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptionId: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
}

export const SubscriptionDialog = ({
  open,
  onClose,
  subscriptionId,
}: SubscriptionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const isEditing = !!subscriptionId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: "",
      plan_id: "",
      status: "trial",
      start_date: new Date(),
      payment_method: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const [companiesRes, plansRes] = await Promise.all([
        supabase.from("companies").select("id, name").eq("status", "active"),
        supabase.from("plans").select("id, name").eq("status", "active"),
      ]);

      if (companiesRes.data) setCompanies(companiesRes.data);
      if (plansRes.data) setPlans(plansRes.data);
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (open && subscriptionId) {
      const fetchSubscription = async () => {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", subscriptionId)
          .single();

        if (error) {
          toast({
            title: "Erro ao carregar assinatura",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data) {
          form.reset({
            company_id: data.company_id,
            plan_id: data.plan_id,
            status: data.status as any,
            start_date: new Date(data.start_date),
            end_date: data.end_date ? new Date(data.end_date) : undefined,
            trial_end_date: data.trial_end_date ? new Date(data.trial_end_date) : undefined,
            payment_method: data.payment_method || "",
          });
        }
      };

      fetchSubscription();
    } else if (open) {
      form.reset({
        company_id: "",
        plan_id: "",
        status: "trial",
        start_date: new Date(),
        payment_method: "",
      });
    }
  }, [open, subscriptionId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const subscriptionData = {
      company_id: values.company_id,
      plan_id: values.plan_id,
      status: values.status,
      start_date: values.start_date.toISOString(),
      end_date: values.end_date?.toISOString() || null,
      trial_end_date: values.trial_end_date?.toISOString() || null,
      payment_method: values.payment_method || null,
    };

    const { error } = isEditing
      ? await supabase
          .from("subscriptions")
          .update(subscriptionData)
          .eq("id", subscriptionId)
      : await supabase.from("subscriptions").insert([subscriptionData]);

    setLoading(false);

    if (error) {
      toast({
        title: isEditing ? "Erro ao atualizar assinatura" : "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: isEditing ? "Assinatura atualizada com sucesso" : "Assinatura criada com sucesso",
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Assinatura" : "Nova Assinatura"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da assinatura"
              : "Preencha os dados para criar uma nova assinatura"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
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

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Término (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
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

            <FormField
              control={form.control}
              name="trial_end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Fim do Trial (opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
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

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cartão de Crédito" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
