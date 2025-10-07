import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { PartnerCommissionsTable } from "@/components/company/invoices/payable/PartnerCommissionsTable";

export default function Payable() {
  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Contas a Pagar">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comissões de Parceiros</h2>
          <p className="text-muted-foreground">
            Gerencie os pagamentos de comissões aos parceiros
          </p>
        </div>
        <PartnerCommissionsTable />
      </div>
    </AppLayout>
  );
}
