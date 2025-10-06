import { useState } from "react";
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
  billing_cycle: "monthly" | "annual" | "semiannual" | null;
  payment_methods: any;
  features: any;
  status: "active" | "inactive" | "archived";
  company_id: string | null;
  sku: string | null;
}

const Services = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleNewService = () => {
    setSelectedService(null);
    setDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
  };

  return (
    <SuperAdminLayout>
      <ServicesHeader onNewService={handleNewService} />
      <ServicesTable onEdit={handleEditService} />
      <ServiceDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        service={selectedService}
      />
    </SuperAdminLayout>
  );
};

export default Services;
