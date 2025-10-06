import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { SubscriptionsHeader } from "@/components/superadmin/subscriptions/SubscriptionsHeader";
import { SubscriptionsTable } from "@/components/superadmin/subscriptions/SubscriptionsTable";
import { SubscriptionDialog } from "@/components/superadmin/subscriptions/SubscriptionDialog";

const Subscriptions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);

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
        <div className="animate-pulse text-primary text-2xl font-bold">
          Carregando...
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const handleCreateSubscription = () => {
    setEditingSubscriptionId(null);
    setIsDialogOpen(true);
  };

  const handleEditSubscription = (subscriptionId: string) => {
    setEditingSubscriptionId(subscriptionId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubscriptionId(null);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <SubscriptionsHeader onCreateSubscription={handleCreateSubscription} />
        <SubscriptionsTable onEditSubscription={handleEditSubscription} />
        <SubscriptionDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          subscriptionId={editingSubscriptionId}
        />
      </div>
    </SuperAdminLayout>
  );
};

export default Subscriptions;
