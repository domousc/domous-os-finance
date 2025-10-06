import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Users, Loader2, Shield } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company_id: z.string().min(1, "Selecione uma empresa"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
  roles: z.array(z.string()).min(1, "Selecione pelo menos um role"),
});

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

interface Company {
  id: string;
  name: string;
}

type UserRole = "superadmin" | "admin" | "gestor" | "financeiro" | "operador";

const availableRoles: { value: UserRole; label: string; description: string }[] = [
  { value: "superadmin", label: "Super Admin", description: "Acesso total ao sistema" },
  { value: "admin", label: "Admin", description: "Administrador da empresa" },
  { value: "gestor", label: "Gestor", description: "Gerenciamento de operações" },
  { value: "financeiro", label: "Financeiro", description: "Gestão financeira" },
  { value: "operador", label: "Operador", description: "Operações básicas" },
];

export const UserDialog = ({ open, onClose, userId }: UserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const isEditing = !!userId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      company_id: "",
      password: "",
      avatar_url: "",
      roles: [],
    },
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("status", "active");

      if (data) setCompanies(data);
    };

    if (open) {
      fetchCompanies();
    }
  }, [open]);

  useEffect(() => {
    if (open && userId) {
      const fetchUser = async () => {
        // Buscar perfil
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

        // Buscar roles
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        // Buscar email do auth.users via RPC ou função
        // Como não temos acesso direto, vamos deixar o campo email desabilitado na edição
        
        if (profileData) {
          form.reset({
            full_name: profileData.full_name || "",
            email: "", // Email não pode ser editado facilmente
            phone: profileData.phone || "",
            company_id: profileData.company_id || "",
            password: "",
            avatar_url: profileData.avatar_url || "",
            roles: rolesData?.map((r) => r.role) || [],
          });
        }
      };

      fetchUser();
    } else if (open) {
      form.reset({
        full_name: "",
        email: "",
        phone: "",
        company_id: "",
        password: "",
        avatar_url: "",
        roles: [],
      });
    }
  }, [open, userId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      if (isEditing) {
        // Atualizar perfil
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: values.full_name,
            phone: values.phone || null,
            company_id: values.company_id,
            avatar_url: values.avatar_url || null,
          })
          .eq("id", userId);

        if (profileError) throw profileError;

        // Atualizar roles - deletar todos e reinserir
        await supabase.from("user_roles").delete().eq("user_id", userId);

        const rolesData = values.roles.map((role) => ({
          user_id: userId,
          role: role as UserRole,
          company_id: values.company_id,
        }));

        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(rolesData);

        if (rolesError) throw rolesError;

        toast({
          title: "Usuário atualizado com sucesso",
        });
      } else {
        // Criar novo usuário via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password || Math.random().toString(36).slice(-8),
          options: {
            data: {
              full_name: values.full_name,
              company_id: values.company_id,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao criar usuário");

        // Atualizar perfil adicional
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            phone: values.phone || null,
            avatar_url: values.avatar_url || null,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Erro ao atualizar perfil:", profileError);
        }

        // Inserir roles
        const rolesData = values.roles.map((role) => ({
          user_id: authData.user!.id,
          role: role as UserRole,
          company_id: values.company_id,
        }));

        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(rolesData);

        if (rolesError) throw rolesError;

        toast({
          title: "Usuário criado com sucesso",
          description: "Um email de confirmação foi enviado para o usuário.",
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
                Empresa e Permissões
              </h3>

              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa *</FormLabel>
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
                name="roles"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Roles / Permissões *
                      </FormLabel>
                      <FormDescription>
                        Selecione os roles que este usuário terá
                      </FormDescription>
                    </div>
                    <div className="space-y-3">
                      {availableRoles.map((role) => (
                        <FormField
                          key={role.value}
                          control={form.control}
                          name="roles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={role.value}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role.value)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, role.value])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== role.value
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">
                                    {role.label}
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    {role.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
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
