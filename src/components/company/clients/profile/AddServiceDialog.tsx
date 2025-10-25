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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PREDEFINED_SERVICES = [
  "Tráfego Pago",
  "Social Media",
  "Audiovisual",
  "CRM",
  "E-commerce",
  "Assessoria E-commerce",
  "Outro",
];

const serviceSchema = z.object({
  service_name: z.string().min(1, "Selecione um serviço"),
  custom_service_name: z.string().optional(),
  price: z.string().min(1, "Informe o valor do serviço"),
  package_total_value: z.string().optional(),
  cycles: z.string().min(1, "Informe a quantidade de ciclos"),
  start_date: z.string().min(1, "Informe a data de início"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface AddServiceDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

export function AddServiceDialog({
  open,
  onClose,
  clientId,
}: AddServiceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_name: "",
      custom_service_name: "",
      price: "",
      package_total_value: "",
      cycles: "1",
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedService = form.watch("service_name");
  const isCustomService = selectedService === "Outro";

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .single();

      if (!profile?.company_id) {
        throw new Error("Empresa não encontrada");
      }

      const finalServiceName =
        isCustomService && data.custom_service_name
          ? data.custom_service_name
          : data.service_name;

      const { error } = await supabase.from("client_services").insert({
        client_id: clientId,
        company_id: profile.company_id,
        service_name: finalServiceName,
        custom_price: parseFloat(data.price),
        package_total_value: data.package_total_value
          ? parseFloat(data.package_total_value)
          : null,
        cycles: parseInt(data.cycles),
        start_date: data.start_date,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Serviço adicionado",
        description: "Serviço adicionado com sucesso",
      });

      form.reset();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar serviço",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Serviço</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="service_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PREDEFINED_SERVICES.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCustomService && (
              <FormField
                control={form.control}
                name="custom_service_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Serviço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome do serviço"
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Serviço (R$)</FormLabel>
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
              name="package_total_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total do Pacote (Opcional)</FormLabel>
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
              name="cycles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Ciclos</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Adicionar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
