import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { PayableStats } from "@/components/company/invoices/payable/PayableStats";
import { PayableHeader } from "@/components/company/invoices/payable/PayableHeader";
import { PartnerCommissionsTable } from "@/components/company/invoices/payable/PartnerCommissionsTable";

export default function Payable() {
  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Contas a Pagar">
      <div className="space-y-6">
        <PayableStats />
        <PayableHeader />
        <PartnerCommissionsTable />
      </div>
    </AppLayout>
  );
}
