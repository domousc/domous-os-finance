import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { PayableStats } from "@/components/company/invoices/payable/PayableStats";
import { PayableHeader } from "@/components/company/invoices/payable/PayableHeader";
import { PayableItemsTable } from "@/components/company/invoices/payable/PayableItemsTable";

export default function Payable() {
  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="À Pagar">
      <div className="space-y-6">
        <PayableStats />
        <PayableHeader />
        <PayableItemsTable />
      </div>
    </AppLayout>
  );
}
