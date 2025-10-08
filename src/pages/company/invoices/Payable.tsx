import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { PayableStats } from "@/components/company/invoices/payable/PayableStats";
import { PayableHeader } from "@/components/company/invoices/payable/PayableHeader";
import { PayableItemsTable } from "@/components/company/invoices/payable/PayableItemsTable";
import { PeriodFilter, type Period } from "@/components/shared/PeriodFilter";

export default function Payable() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="À Pagar">
      <div className="space-y-6">
        <PayableHeader />
        <PeriodFilter period={period} onPeriodChange={setPeriod} />
        <PayableStats period={period} />
        <PayableItemsTable period={period} />
      </div>
    </AppLayout>
  );
}
