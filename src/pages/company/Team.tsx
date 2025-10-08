import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { TeamHeader } from "@/components/company/team/TeamHeader";
import { TeamStats } from "@/components/company/team/TeamStats";
import { TeamMembersTable } from "@/components/company/team/TeamMembersTable";
import { TeamPaymentsView } from "@/components/company/team/TeamPaymentsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodFilter, type Period } from "@/components/shared/PeriodFilter";

const Team = () => {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Gestão de Equipe"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <TeamHeader />
          <PeriodFilter period={period} onPeriodChange={setPeriod} />
        </div>
        
        <TeamStats period={period} />
        
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Equipe</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="mt-6">
            <TeamMembersTable />
          </TabsContent>
          
          <TabsContent value="payments" className="mt-6">
            <TeamPaymentsView period={period} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Team;
