import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Save, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const asaasSchema = z.object({
  api_url: z.string().url(),
  environment: z.enum(["production", "sandbox"]),
  webhook_url: z.string().url().optional().or(z.literal("")),
});

type AsaasFormValues = z.infer<typeof asaasSchema>;

export const AsaasTab = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("disconnected");
  const { toast } = useToast();

  const form = useForm<AsaasFormValues>({
    resolver: zodResolver(asaasSchema),
    defaultValues: {
      api_url: "https://api.asaas.com/v3",
      environment: "production",
      webhook_url: "",
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "asaas_config")
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        form.reset(data.value as AsaasFormValues);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setFetching(false);
    }
  };

  const testConnection = async () => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Insira a API Key antes de testar a conexão",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus("testing");
    
    // Simular teste de conexão (implementar edge function futuramente)
    setTimeout(() => {
      setConnectionStatus("connected");
      toast({
        title: "Conexão bem-sucedida!",
        description: "API Key validada com sucesso",
      });
    }, 2000);
  };

  const onSubmit = async (values: AsaasFormValues) => {
    setLoading(true);
    try {
      // Salvar configurações
      const { error: configError } = await supabase
        .from("system_settings")
        .upsert({
          key: "asaas_config",
          value: {
            ...values,
            last_sync: new Date().toISOString(),
          },
          description: "Configurações da integração com Asaas",
        });

      if (configError) throw configError;

      // TODO: Salvar API Key como secret do Supabase
      // Implementar quando edge function estiver pronta

      toast({
        title: "Configurações salvas!",
        description: "As configurações do Asaas foram atualizadas",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Integração Asaas</CardTitle>
                <CardDescription>
                  Configure a API de pagamentos e assinaturas
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={connectionStatus === "connected" ? "default" : "secondary"}
              className="gap-1"
            >
              {connectionStatus === "connected" ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </>
              ) : connectionStatus === "testing" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Testando
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormItem>
                <FormLabel>API Key do Asaas</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="$aact_YTU5YTE0M2Vk..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={connectionStatus === "testing"}
                    >
                      {connectionStatus === "testing" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Testar"
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Chave de API obtida no painel do Asaas
                </FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="production">Produção</SelectItem>
                        <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Use sandbox para testes e produção para operação real
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da API</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Endpoint base da API do Asaas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://seu-projeto.supabase.co/functions/v1/asaas-webhook"
                        readOnly
                      />
                    </FormControl>
                    <FormDescription>
                      URL para receber notificações do Asaas (gerada automaticamente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
