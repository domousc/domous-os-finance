import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { DashboardStats } from "@/components/superadmin/DashboardStats";
import { LoadingScreen } from "@/components/LoadingScreen";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();

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
    return <LoadingScreen message="Carregando dashboard" />;
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <SuperAdminLayout>
      <DashboardStats />
    </SuperAdminLayout>
  );
};

export default SuperAdmin;
