import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { PayableStats } from "@/components/company/invoices/payable/PayableStats";
import { PayableHeader } from "@/components/company/invoices/payable/PayableHeader";
import { PayableItemsTable } from "@/components/company/invoices/payable/PayableItemsTable";
import { PersonPayableView } from "@/components/company/invoices/payable/PersonPayableView";
import { PeriodFilter, type Period, type CustomDateRange } from "@/components/shared/PeriodFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Payable() {
  const [period, setPeriod] = useState<Period>("30d");
  const [customRange, setCustomRange] = useState<CustomDateRange>();

  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="À Pagar">
      <div className="space-y-6">
        <PayableHeader />
        <PeriodFilter 
          period={period} 
          onPeriodChange={setPeriod}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
        <PayableStats period={period} />
        
        <Tabs defaultValue="items" className="w-full">
          <TabsList>
            <TabsTrigger value="items">Por Item</TabsTrigger>
            <TabsTrigger value="people">Por Pessoa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items" className="mt-6">
            <PayableItemsTable period={period} />
          </TabsContent>
          
          <TabsContent value="people" className="mt-6">
            <PersonPayableView period={period} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
