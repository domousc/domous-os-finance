import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon } from "lucide-react";
import { CompanyUsersTable } from "./users/CompanyUsersTable";
import { CompanyUserDialog } from "./users/CompanyUserDialog";

export const UsersTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const handleCreateUser = () => {
    setEditingUserId(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUserId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UsersIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Gerenciar Usuários</h3>
            <p className="text-sm text-muted-foreground">
              Adicione e gerencie usuários da sua empresa
            </p>
          </div>
        </div>
        <Button onClick={handleCreateUser} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <CompanyUsersTable onEditUser={handleEditUser} />
      
      <CompanyUserDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        userId={editingUserId}
      />
    </div>
  );
};
