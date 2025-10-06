import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { ServicesHeader } from "@/components/superadmin/services/ServicesHeader";
import { ServicesTable } from "@/components/superadmin/services/ServicesTable";
import { ServiceDialog } from "@/components/superadmin/services/ServiceDialog";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  service_type: "subscription" | "one_time" | "recurring";
  billing_cycle: "monthly" | "quarterly" | "semiannual" | "annual" | null;
  payment_methods: string[];
  sku: string | null;
  features: string[];
  status: "active" | "inactive" | "archived";
  company_id: string | null;
}

const Services = () => {
  const { isSuperAdmin, loading } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return null;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAddService = () => {
    setSelectedService(null);
    setDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <ServicesHeader onAddService={handleAddService} />
        <ServicesTable onEdit={handleEditService} refreshTrigger={refreshTrigger} />
        <ServiceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          service={selectedService}
          onSuccess={handleSuccess}
        />
      </div>
    </SuperAdminLayout>
  );
};

export default Services;
