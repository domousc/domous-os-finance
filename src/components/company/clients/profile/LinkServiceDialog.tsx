import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const linkServiceSchema = z.object({
  service_id: z.string().min(1, "Serviço é obrigatório"),
  custom_price: z.string().optional(),
  cycles: z.string().min(1, "Mensalidades é obrigatória"),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  first_due_date: z.string().optional(),
});

type LinkServiceFormData = z.infer<typeof linkServiceSchema>;

interface Service {
  id: string;
  title: string;
  price: number;
  billing_cycle: string | null;
}

interface LinkServiceDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

export function LinkServiceDialog({
  open,
  onClose,
  clientId,
}: LinkServiceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const form = useForm<LinkServiceFormData>({
    resolver: zodResolver(linkServiceSchema),
    defaultValues: {
      service_id: "",
      custom_price: "",
      cycles: "1",
      start_date: new Date().toISOString().split("T")[0],
      first_due_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("title");

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar serviços",
        description: error.message,
      });
    }
  };

  const onSubmit = async (data: LinkServiceFormData) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Company not found");
      }

      const linkData = {
        client_id: clientId,
        service_id: data.service_id,
        company_id: profile.company_id,
        custom_price: data.custom_price ? parseFloat(data.custom_price) : null,
        cycles: parseInt(data.cycles),
        start_date: data.start_date,
        first_due_date: data.first_due_date || null,
        status: "active",
      };

      const { error } = await supabase
        .from("client_services")
        .insert([linkData]);

      if (error) throw error;

      toast({
        title: "Serviço vinculado",
        description: "Serviço vinculado com sucesso. As faturas foram geradas automaticamente.",
      });

      form.reset();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao vincular serviço",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular Serviço</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const service = services.find((s) => s.id === value);
                      setSelectedService(service || null);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.title} - R$ {service.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedService && (
              <div className="text-sm text-muted-foreground">
                Valor padrão: R$ {selectedService.price.toFixed(2)} -{" "}
                {selectedService.billing_cycle === "monthly"
                  ? "Mensal"
                  : selectedService.billing_cycle === "annual"
                  ? "Anual"
                  : "Pagamento único"}
              </div>
            )}

            <FormField
              control={form.control}
              name="custom_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Customizado (opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                  <FormLabel>Mensalidades *</FormLabel>
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
                  <FormLabel>Data de Início *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="first_due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primeiro Vencimento (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Vincular</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
