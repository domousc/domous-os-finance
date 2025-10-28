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
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  package_total_value: z.string().min(1, "Informe o valor total do pacote"),
  installments: z.string().min(1, "Informe a quantidade de mensalidades"),
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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentService, setCurrentService] = useState("");
  const [customServiceName, setCustomServiceName] = useState("");

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      package_total_value: "",
      installments: "1",
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  const handleAddService = () => {
    if (currentService === "Outro" && customServiceName.trim()) {
      setSelectedServices([...selectedServices, customServiceName.trim()]);
      setCustomServiceName("");
      setCurrentService("");
    } else if (currentService && currentService !== "Outro") {
      if (!selectedServices.includes(currentService)) {
        setSelectedServices([...selectedServices, currentService]);
      }
      setCurrentService("");
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione ou digite um serviço",
      });
    }
  };

  const handleRemoveService = (service: string) => {
    setSelectedServices(selectedServices.filter((s) => s !== service));
  };

  const onSubmit = async (data: ServiceFormData) => {
    if (selectedServices.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Adicione pelo menos um serviço ao pacote",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar serviços",
        });
        throw new Error("Usuário não autenticado");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Empresa não encontrada. Verifique seu perfil.",
        });
        throw new Error("Empresa não encontrada");
      }

      const packageTotalValue = parseFloat(data.package_total_value);
      const installments = parseInt(data.installments);

      // Criar um registro de pacote com todos os serviços concatenados
      const packageName = selectedServices.join(" + ");

      const { error } = await supabase.from("client_services").insert({
        client_id: clientId,
        company_id: profile.company_id,
        service_name: packageName,
        custom_price: packageTotalValue,
        package_total_value: packageTotalValue,
        cycles: installments,
        start_date: data.start_date,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Pacote de serviços adicionado",
        description: `Pacote com ${selectedServices.length} serviço(s) adicionado com sucesso`,
      });

      form.reset();
      setSelectedServices([]);
      setCurrentService("");
      setCustomServiceName("");
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar pacote",
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
            {/* Seção de adicionar serviços ao pacote */}
            <div className="space-y-3">
              <FormLabel>Serviços do Pacote/Plano</FormLabel>
              <div className="flex gap-2">
                <Select value={currentService} onValueChange={setCurrentService}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_SERVICES.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddService}
                  disabled={!currentService}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {currentService === "Outro" && (
                <Input
                  placeholder="Digite o nome do serviço"
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                />
              )}

              {/* Lista de serviços selecionados */}
              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                  {selectedServices.map((service, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {service}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service)}
                        className="ml-1 hover:bg-destructive/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="package_total_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total do Pacote (R$)</FormLabel>
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
              name="installments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensalidades</FormLabel>
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
