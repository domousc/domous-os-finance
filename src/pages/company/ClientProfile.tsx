import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientInfo } from "@/components/company/clients/profile/ClientInfo";
import { ClientServicesSection } from "@/components/company/clients/profile/ClientServicesSection";
import { ClientInvoicesSection } from "@/components/company/clients/profile/ClientInvoicesSection";
import { ClientCommissionsSection } from "@/components/company/clients/profile/ClientCommissionsSection";
import { LinkServiceDialog } from "@/components/company/clients/profile/LinkServiceDialog";

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [linkServiceOpen, setLinkServiceOpen] = useState(false);

  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Perfil do Cliente">
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

        <ClientCommissionsSection clientId={id!} />

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
