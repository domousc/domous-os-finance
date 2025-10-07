import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerInfo } from "@/components/company/partners/profile/PartnerInfo";
import { PartnerAgreements } from "@/components/company/partners/profile/PartnerAgreements";
import { PartnerCommissions } from "@/components/company/partners/profile/PartnerCommissions";
import { AgreementDialog } from "@/components/company/partners/profile/AgreementDialog";

export default function PartnerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);

  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Perfil do Parceiro">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/partners")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <PartnerInfo partnerId={id!} />

        <PartnerAgreements
          partnerId={id!}
          onAddAgreement={() => setAgreementDialogOpen(true)}
        />

        <PartnerCommissions partnerId={id!} />

        <AgreementDialog
          open={agreementDialogOpen}
          onClose={() => setAgreementDialogOpen(false)}
          partnerId={id!}
        />
      </div>
    </AppLayout>
  );
}
