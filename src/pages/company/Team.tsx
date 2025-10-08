import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { TeamHeader } from "@/components/company/team/TeamHeader";
import { TeamStats } from "@/components/company/team/TeamStats";
import { TeamMembersTable } from "@/components/company/team/TeamMembersTable";
import { TeamPaymentsView } from "@/components/company/team/TeamPaymentsView";
import { CompanySettings } from "@/components/company/team/CompanySettings";
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
        
        <Tabs defaultValue="payments" className="w-full">
          <TabsList>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="members">Equipe</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments" className="mt-6">
            <TeamPaymentsView period={period} />
          </TabsContent>
          
          <TabsContent value="members" className="mt-6">
            <TeamMembersTable />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <CompanySettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Team;
