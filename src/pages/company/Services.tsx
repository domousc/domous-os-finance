import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { ServicesHeader } from "@/components/superadmin/services/ServicesHeader";
import { ServicesTable } from "@/components/superadmin/services/ServicesTable";
import { ServiceDialog } from "@/components/superadmin/services/ServiceDialog";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserCheck,
  FileBarChart,
  UsersRound,
  Settings,
  UserPlus,
  UserCircle,
  Briefcase,
} from "lucide-react";
import type { MenuItem } from "@/components/shared/AppLayout";

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

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: Users,
    label: "Clientes",
    path: "/dashboard/clients",
  },
  {
    icon: Briefcase,
    label: "Serviços",
    path: "/dashboard/services",
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    path: "/dashboard/financial",
  },
  {
    icon: UserCheck,
    label: "Controle Pessoal",
    path: "/dashboard/personal",
  },
  {
    icon: FileBarChart,
    label: "Relatórios Gerais",
    path: "/dashboard/reports",
  },
  {
    icon: UsersRound,
    label: "Times",
    path: "/dashboard/teams",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/dashboard/settings",
    submenu: [
      {
        icon: UserPlus,
        label: "Cadastro de Usuários",
        path: "/dashboard/settings/users",
      },
      {
        icon: UserCircle,
        label: "Perfil",
        path: "/dashboard/settings/profile",
      },
    ],
  },
];

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
    <AppLayout
      menuItems={menuItems}
      headerTitle="Domous OS"
      headerBadge="Painel de Gestão"
    >
      <ServicesHeader onNewService={handleNewService} />
      <ServicesTable onEdit={handleEditService} />
      <ServiceDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        service={selectedService}
      />
    </AppLayout>
  );
};

export default Services;
