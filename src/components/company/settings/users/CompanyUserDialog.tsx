import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  FormDescription,
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
import { toast } from "@/hooks/use-toast";
import { Users, Loader2, Shield } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
  role: z.enum(["admin", "viewer"], {
    required_error: "Selecione um nível de acesso",
  }),
});

interface CompanyUserDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

export const CompanyUserDialog = ({ open, onClose, userId }: CompanyUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isEditing = !!userId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      avatar_url: "",
      role: "viewer",
    },
  });

  useEffect(() => {
    if (open && userId) {
      const fetchUser = async () => {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) {
          toast({
            title: "Erro ao carregar usuário",
            description: profileError.message,
            variant: "destructive",
          });
          return;
        }

        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .limit(1)
          .single();

        if (profileData) {
          form.reset({
            full_name: profileData.full_name || "",
            email: "",
            phone: profileData.phone || "",
            password: "",
            avatar_url: profileData.avatar_url || "",
            role: rolesData?.role === "admin" ? "admin" : "viewer",
          });
        }
      };

      fetchUser();
    } else if (open) {
      form.reset({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        avatar_url: "",
        role: "viewer",
      });
    }
  }, [open, userId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      // Buscar company_id do usuário atual
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!currentProfile?.company_id) {
        throw new Error("Empresa não encontrada");
      }

      if (isEditing) {
        // Atualizar perfil
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: values.full_name,
            phone: values.phone || null,
            avatar_url: values.avatar_url || null,
          })
          .eq("id", userId);

        if (profileError) throw profileError;

        // Atualizar role
        await supabase.from("user_roles").delete().eq("user_id", userId);

        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert([{
            user_id: userId,
            role: values.role,
            company_id: currentProfile.company_id,
          }]);

        if (rolesError) throw rolesError;

        toast({
          title: "Usuário atualizado com sucesso",
        });
      } else {
        // Criar novo usuário via Edge Function
        const { data, error: functionError } = await supabase.functions.invoke(
          'admin-create-user',
          {
            body: {
              email: values.email,
              password: values.password || undefined,
              full_name: values.full_name,
              phone: values.phone,
              company_id: currentProfile.company_id,
              avatar_url: values.avatar_url,
              roles: [values.role],
            },
          }
        );

        if (functionError) {
          throw new Error(functionError.message || 'Erro ao criar usuário');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Erro ao criar usuário');
        }

        toast({
          title: "Usuário criado com sucesso",
          description: "O usuário foi adicionado à sua empresa.",
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: isEditing ? "Erro ao atualizar usuário" : "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {isEditing ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Atualize os dados do usuário"
                  : "Preencha os dados para criar um novo usuário"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Pessoais
              </h3>
              
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@email.com"
                          {...field}
                          disabled={isEditing}
                        />
                      </FormControl>
                      {isEditing && (
                        <FormDescription>
                          Email não pode ser alterado
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Deixe em branco para gerar uma senha aleatória
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Avatar</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/avatar.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Nível de Acesso
              </h3>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Permissão *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível de acesso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Admin</span>
                            <span className="text-xs text-muted-foreground">
                              Acesso completo e visualização total
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Visualização</span>
                            <span className="text-xs text-muted-foreground">
                              Acesso limitado: Dashboard, Clientes, Parceiros e Controle Pessoal
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "admin" 
                        ? "Este usuário terá acesso a todas as funcionalidades do sistema"
                        : "Este usuário terá acesso apenas aos módulos básicos"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar Usuário"
                  : "Criar Usuário"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
