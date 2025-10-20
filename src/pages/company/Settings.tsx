import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { SubscriptionInfo } from "@/components/company/settings/SubscriptionInfo";
import { CompanyInfo } from "@/components/company/settings/CompanyInfo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CreditCard } from "lucide-react";

export default function Settings() {
  return (
    <AppLayout
      menuItems={companyMenuItems}
      headerTitle="Domous OS"
      headerBadge="Configurações"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs items={[{ label: "Configurações" }]} />
            <h1 className="text-2xl font-bold mt-2">Configurações</h1>
            <p className="text-xs text-muted-foreground">
              Gerencie informações da empresa e assinatura
            </p>
          </div>
        </div>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="company" className="flex items-center gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5" />
              <span>Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2 text-xs">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Assinatura</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-4">
            <CompanyInfo />
          </TabsContent>

          <TabsContent value="subscription" className="mt-4">
            <SubscriptionInfo />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
