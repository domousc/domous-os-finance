import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { TeamHeader } from "@/components/company/team/TeamHeader";
import { TeamStats } from "@/components/company/team/TeamStats";
import { TeamMembersTable } from "@/components/company/team/TeamMembersTable";
import { TeamPaymentsView } from "@/components/company/team/TeamPaymentsView";
import { CompanySettings } from "@/components/company/team/CompanySettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Team = () => {

  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Gestão de Equipe"
    >
      <div className="space-y-6">
        <TeamHeader />
        
        <TeamStats />
        
        <Tabs defaultValue="payments" className="w-full">
          <TabsList>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="members">Equipe</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments" className="mt-6">
            <TeamPaymentsView />
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
