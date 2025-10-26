import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Users, Shield } from "lucide-react";
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
  created_at: string;
}

interface UserRole {
  role: string;
}

interface CompanyUsersTableProps {
  onEditUser: (userId: string) => void;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  viewer: "Visualização",
};

const roleColors: Record<string, string> = {
  admin: "bg-blue-500",
  viewer: "bg-green-500",
};

export const CompanyUsersTable = ({ onEditUser }: CompanyUsersTableProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    if (!currentUser) return;

    // Buscar company_id do usuário atual
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", currentUser.id)
      .single();

    if (!currentProfile?.company_id) {
      setLoading(false);
      return;
    }

    // Buscar usuários da mesma empresa
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .eq("company_id", currentProfile.company_id)
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
        .eq("user_id", user.id)
        .limit(1)
        .single();
      
      return { userId: user.id, role: rolesData?.role || "viewer" };
    });

    const rolesResults = await Promise.all(rolesPromises);
    const rolesMap: Record<string, string> = {};
    rolesResults.forEach(({ userId, role }) => {
      rolesMap[userId] = role;
    });

    setUserRoles(rolesMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    const profilesChannel = supabase
      .channel("company-profiles-changes")
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
      .channel("company-user-roles-changes")
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
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: id }
      });

      if (error) {
        toast({
          title: "Erro ao excluir usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro ao excluir usuário",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário excluído com sucesso",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
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
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
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
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Usuário</TableHead>
            <TableHead className="font-semibold">Nível de Acesso</TableHead>
            <TableHead className="font-semibold">Telefone</TableHead>
            <TableHead className="font-semibold">Cadastro</TableHead>
            <TableHead className="text-right font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const role = userRoles[user.id] || "viewer";
            
            return (
              <TableRow
                key={user.id}
                className="hover:bg-muted/50 transition-all duration-200 group"
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${roleColors[role]}`}
                          />
                          {roleLabels[role] || role}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {role === "admin" 
                            ? "Acesso total ao sistema"
                            : "Acesso limitado aos módulos básicos"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditUser(user.id)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar usuário</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir usuário</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário{" "}
                            <strong>{user.full_name}</strong>? Esta ação não pode
                            ser desfeita.
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
