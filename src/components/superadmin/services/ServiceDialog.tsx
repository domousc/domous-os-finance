import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  service_type: "subscription" | "one_time" | "recurring";
  billing_cycle: "monthly" | "quarterly" | "semiannual" | "annual" | null;
  payment_methods: string[];
  sku: string | null;
  features: string[];
  status: "active" | "inactive" | "archived";
  company_id: string | null;
}

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  company_id: z.string().nullable(),
  sku: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  service_type: z.enum(["subscription", "one_time", "recurring"]),
  billing_cycle: z.enum(["monthly", "quarterly", "semiannual", "annual"]).nullable(),
  payment_methods: z.array(z.string()).min(1, "Selecione ao menos um método"),
  status: z.enum(["active", "inactive", "archived"]),
});

const paymentMethodOptions = [
  { id: "pix", label: "PIX" },
  { id: "credit_card", label: "Cartão de Crédito" },
  { id: "debit_card", label: "Cartão de Débito" },
  { id: "bank_slip", label: "Boleto" },
  { id: "bank_transfer", label: "Transferência" },
];

export const ServiceDialog = ({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceDialogProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      company_id: null,
      sku: "",
      price: "0",
      service_type: "one_time",
      billing_cycle: null,
      payment_methods: [],
      status: "active",
    },
  });

  const serviceType = form.watch("service_type");

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      
      setCompanies(data || []);
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (service) {
      form.reset({
        title: service.title,
        description: service.description || "",
        company_id: service.company_id,
        sku: service.sku || "",
        price: service.price.toString(),
        service_type: service.service_type,
        billing_cycle: service.billing_cycle,
        payment_methods: service.payment_methods || [],
        status: service.status,
      });
      setFeatures(service.features || []);
    } else {
      form.reset({
        title: "",
        description: "",
        company_id: null,
        sku: "",
        price: "0",
        service_type: "one_time",
        billing_cycle: null,
        payment_methods: [],
        status: "active",
      });
      setFeatures([]);
    }
  }, [service, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const serviceData = {
        title: values.title,
        description: values.description || null,
        company_id: values.company_id,
        sku: values.sku || null,
        price: parseFloat(values.price),
        service_type: values.service_type,
        billing_cycle: values.service_type === "subscription" ? values.billing_cycle : null,
        payment_methods: values.payment_methods,
        features: features,
        status: values.status,
      };

      if (service) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", service.id);

        if (error) throw error;

        toast({
          title: "Serviço atualizado",
          description: "As alterações foram salvas com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("services")
          .insert([serviceData]);

        if (error) throw error;

        toast({
          title: "Serviço criado",
          description: "O serviço foi cadastrado com sucesso",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o serviço",
        variant: "destructive",
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-medium">Informações Básicas</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do serviço" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descreva o serviço" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Sem empresa</SelectItem>
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
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Código do produto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Precificação */}
            <div className="space-y-4">
              <h3 className="font-medium">Precificação</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one_time">Único</SelectItem>
                          <SelectItem value="subscription">Assinatura</SelectItem>
                          <SelectItem value="recurring">Recorrente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {serviceType === "subscription" && (
                <FormField
                  control={form.control}
                  name="billing_cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciclo de Pagamento *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="semiannual">Semestral</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Métodos de Pagamento */}
            <FormField
              control={form.control}
              name="payment_methods"
              render={() => (
                <FormItem>
                  <FormLabel>Métodos de Pagamento *</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethodOptions.map((method) => (
                      <FormField
                        key={method.id}
                        control={form.control}
                        name="payment_methods"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(method.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  const updated = checked
                                    ? [...current, method.id]
                                    : current.filter((val) => val !== method.id);
                                  field.onChange(updated);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {method.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Funcionalidades */}
            <div className="space-y-4">
              <FormLabel>Funcionalidades</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Adicionar funcionalidade"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button type="button" onClick={addFeature} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {features.length > 0 && (
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {service ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
