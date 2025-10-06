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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Clock, Save, Play, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const cronSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["hourly", "daily", "weekly", "monthly"]),
  execution_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

type CronFormValues = z.infer<typeof cronSchema>;

type LogEntry = {
  id: string;
  timestamp: string;
  status: "success" | "error" | "running";
  message: string;
};

export const CronTab = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  const form = useForm<CronFormValues>({
    resolver: zodResolver(cronSchema),
    defaultValues: {
      enabled: false,
      frequency: "daily",
      execution_time: "03:00",
    },
  });

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "cron_config")
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        form.reset(data.value as CronFormValues);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setFetching(false);
    }
  };

  const loadLogs = async () => {
    // Mock logs - implementar busca real posteriormente
    setLogs([
      {
        id: "1",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: "success",
        message: "Sincronização concluída: 45 assinaturas atualizadas",
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: "success",
        message: "Sincronização concluída: 42 assinaturas atualizadas",
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        status: "error",
        message: "Erro ao conectar com API do Asaas",
      },
    ]);
  };

  const executeNow = async () => {
    setExecuting(true);
    try {
      // TODO: Implementar chamada à edge function de sincronização
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Sincronização iniciada!",
        description: "A sincronização manual foi executada com sucesso",
      });

      loadLogs();
    } catch (error) {
      console.error("Error executing sync:", error);
      toast({
        title: "Erro ao executar",
        description: "Não foi possível iniciar a sincronização",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  const onSubmit = async (values: CronFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "cron_config",
          value: {
            ...values,
            last_execution: new Date().toISOString(),
            last_status: "success",
          },
          description: "Configurações de sincronização automática de assinaturas",
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: "O agendamento foi atualizado com sucesso",
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

  const getStatusBadge = (status: LogEntry["status"]) => {
    const variants = {
      success: { variant: "default" as const, icon: CheckCircle2, label: "Sucesso" },
      error: { variant: "destructive" as const, icon: XCircle, label: "Erro" },
      running: { variant: "secondary" as const, icon: Loader2, label: "Executando" },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
    );
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Sincronização Automática</CardTitle>
              <CardDescription>
                Configure a sincronização periódica com o Asaas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Ativar Sincronização Automática
                      </FormLabel>
                      <FormDescription>
                        Sincroniza automaticamente assinaturas com o Asaas
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!form.watch("enabled")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                        <SelectItem value="weekly">Semanalmente</SelectItem>
                        <SelectItem value="monthly">Mensalmente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Com que frequência a sincronização deve ocorrer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="execution_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Execução</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={!form.watch("enabled")}
                      />
                    </FormControl>
                    <FormDescription>
                      Horário preferencial para executar a sincronização
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={executeNow}
                  disabled={executing}
                >
                  {executing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Executar Agora
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
          <CardDescription>
            Últimas 10 execuções da sincronização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma execução registrada ainda
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.timestamp).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
