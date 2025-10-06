import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Users, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_id: string | null;
  created_at: string;
  companies: { id: string; name: string } | null;
}

interface UserRole {
  role: string;
}

interface UsersTableProps {
  onEditUser: (userId: string) => void;
}

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  gestor: "Gestor",
  financeiro: "Financeiro",
  operador: "Operador",
};

const roleColors: Record<string, string> = {
  superadmin: "bg-purple-500",
  admin: "bg-blue-500",
  gestor: "bg-green-500",
  financeiro: "bg-yellow-500",
  operador: "bg-gray-500",
};

export const UsersTable = ({ onEditUser }: UsersTableProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        *,
        companies (id, name)
      `)
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({
        title: "Erro ao carregar usuários",
        description: profilesError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setUsers(profilesData || []);

    // Buscar roles de cada usuário
    const rolesPromises = (profilesData || []).map(async (user) => {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      return { userId: user.id, roles: rolesData || [] };
    });

    const rolesResults = await Promise.all(rolesPromises);
    const rolesMap: Record<string, UserRole[]> = {};
    rolesResults.forEach(({ userId, roles }) => {
      rolesMap[userId] = roles;
    });

    setUserRoles(rolesMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    const profilesChannel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel("user-roles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    // Primeiro deletar os roles do usuário
    const { error: rolesError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id);

    if (rolesError) {
      toast({
        title: "Erro ao excluir roles do usuário",
        description: rolesError.message,
        variant: "destructive",
      });
      return;
    }

    // Depois deletar o perfil (o auth.user será deletado em cascata)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) {
      toast({
        title: "Erro ao excluir usuário",
        description: profileError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Usuário excluído com sucesso",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 animate-in fade-in-50 duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-muted-foreground animate-pulse">
            Carregando usuários...
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl animate-in fade-in-50 duration-300 bg-muted/20">
        <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-lg font-medium">
          Nenhum usuário cadastrado
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Clique em "Novo Usuário" para adicionar o primeiro usuário
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border animate-in fade-in-50 duration-500 overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Usuário</TableHead>
            <TableHead className="font-semibold">Empresa</TableHead>
            <TableHead className="font-semibold">Roles</TableHead>
            <TableHead className="font-semibold">Telefone</TableHead>
            <TableHead className="font-semibold">Cadastro</TableHead>
            <TableHead className="text-right font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const roles = userRoles[user.id] || [];
            
            return (
              <TableRow
                key={user.id}
                className="hover:bg-muted/50 transition-all duration-200 group"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "User"}
                        className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="group-hover:text-primary transition-colors font-medium">
                        {user.full_name || "Sem nome"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.companies ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {user.companies.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <div className="flex flex-wrap gap-1">
                      {roles.length > 0 ? (
                        roles.map((roleItem, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="gap-1.5 text-xs"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    roleColors[roleItem.role] || "bg-gray-500"
                                  }`}
                                />
                                {roleLabels[roleItem.role] || roleItem.role}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Role: {roleLabels[roleItem.role]}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Sem roles
                        </span>
                      )}
                    </div>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {user.phone || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {format(new Date(user.created_at), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditUser(user.id)}
                          className="hover-scale hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar usuário</p>
                      </TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover-scale hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir usuário</p>
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário{" "}
                            <strong>{user.full_name}</strong>? Esta ação não pode
                            ser desfeita e todos os dados relacionados serão
                            removidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
