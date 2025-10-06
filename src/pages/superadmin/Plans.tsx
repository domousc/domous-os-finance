import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { PlansHeader } from "@/components/superadmin/plans/PlansHeader";
import { PlansTable } from "@/components/superadmin/plans/PlansTable";
import { PlanDialog } from "@/components/superadmin/plans/PlanDialog";
import { useEffect } from "react";

const Plans = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-slow text-primary text-2xl font-bold">
          Carregando...
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const handleCreatePlan = () => {
    setEditingPlanId(null);
    setIsDialogOpen(true);
  };

  const handleEditPlan = (planId: string) => {
    setEditingPlanId(planId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlanId(null);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <PlansHeader onCreatePlan={handleCreatePlan} />
        <PlansTable onEditPlan={handleEditPlan} />
        <PlanDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          planId={editingPlanId}
        />
      </div>
    </SuperAdminLayout>
  );
};

export default Plans;
