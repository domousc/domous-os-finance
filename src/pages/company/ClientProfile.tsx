import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { MenuItem } from "@/components/shared/AppLayout";
import { Users, LayoutDashboard, Settings, DollarSign, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientInfo } from "@/components/company/clients/profile/ClientInfo";
import { ClientServicesSection } from "@/components/company/clients/profile/ClientServicesSection";
import { ClientInvoicesSection } from "@/components/company/clients/profile/ClientInvoicesSection";
import { LinkServiceDialog } from "@/components/company/clients/profile/LinkServiceDialog";

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
    icon: Package,
    label: "Serviços",
    path: "/dashboard/services",
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    path: "/dashboard/invoices",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/dashboard/settings",
  },
];

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [linkServiceOpen, setLinkServiceOpen] = useState(false);

  return (
    <AppLayout menuItems={menuItems} headerTitle="Perfil do Cliente">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/clients")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <ClientInfo clientId={id!} />

        <ClientServicesSection
          clientId={id!}
          onAddService={() => setLinkServiceOpen(true)}
        />

        <ClientInvoicesSection clientId={id!} />

        <LinkServiceDialog
          open={linkServiceOpen}
          onClose={() => setLinkServiceOpen(false)}
          clientId={id!}
        />
      </div>
    </AppLayout>
  );
}
