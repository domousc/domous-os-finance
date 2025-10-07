import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { InvoicesHeader } from "@/components/company/invoices/InvoicesHeader";
import { ReceivableTable } from "@/components/company/invoices/receivable/ReceivableTable";
import { InvoicesStats } from "@/components/company/invoices/InvoicesStats";

export default function Receivable() {
  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Contas a Receber">
      <div className="space-y-6">
        <InvoicesStats />
        <InvoicesHeader />
        <ReceivableTable />
      </div>
    </AppLayout>
  );
}
