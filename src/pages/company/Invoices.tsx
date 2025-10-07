import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { InvoicesHeader } from "@/components/company/invoices/InvoicesHeader";
import { InvoicesTable } from "@/components/company/invoices/InvoicesTable";
import { InvoicesStats } from "@/components/company/invoices/InvoicesStats";

export default function Invoices() {
  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Contas a Receber">
      <div className="space-y-6">
        <InvoicesStats />
        <InvoicesHeader />
        <InvoicesTable />
      </div>
    </AppLayout>
  );
}
