import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { UsersHeader } from "@/components/superadmin/users/UsersHeader";
import { UsersTable } from "@/components/superadmin/users/UsersTable";
import { UserDialog } from "@/components/superadmin/users/UserDialog";
import { LoadingScreen } from "@/components/LoadingScreen";

const Users = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isSuperAdmin) {
        navigate("/dashboard");
      }
    }
  }, [user, isSuperAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return <LoadingScreen message="Carregando usuários" />;
  }

  if (!isSuperAdmin) {
    return null;
  }

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
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <UsersHeader onCreateUser={handleCreateUser} />
        <UsersTable onEditUser={handleEditUser} />
        <UserDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          userId={editingUserId}
        />
      </div>
    </SuperAdminLayout>
  );
};

export default Users;
