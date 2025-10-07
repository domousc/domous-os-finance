import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { PartnersHeader } from "@/components/company/partners/PartnersHeader";
import { PartnersTable } from "@/components/company/partners/PartnersTable";
import { PartnerDialog } from "@/components/company/partners/PartnerDialog";

interface Partner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  cnpj: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  pix_key: string | null;
  notes: string | null;
  status: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export default function Partners() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | undefined>();

  const handleNewPartner = () => {
    setSelectedPartner(undefined);
    setDialogOpen(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPartner(undefined);
  };

  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Parceiros">
      <div className="space-y-6">
        <PartnersHeader onNewPartner={handleNewPartner} />
        <PartnersTable onEditPartner={handleEditPartner} />
        <PartnerDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          partner={selectedPartner}
        />
      </div>
    </AppLayout>
  );
}
