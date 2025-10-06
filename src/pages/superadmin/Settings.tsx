import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { SettingsHeader } from "@/components/superadmin/settings/SettingsHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppearanceTab } from "@/components/superadmin/settings/AppearanceTab";
import { AsaasTab } from "@/components/superadmin/settings/AsaasTab";
import { CronTab } from "@/components/superadmin/settings/CronTab";
import { Palette, DollarSign, Clock } from "lucide-react";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && !isSuperAdmin) {
      navigate("/");
    }
  }, [authLoading, roleLoading, isSuperAdmin, navigate]);

  if (authLoading || roleLoading) {
    return <LoadingScreen message="Carregando configurações..." />;
  }

  if (!user || !isSuperAdmin) {
    return null;
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom duration-500">
        <SettingsHeader />
        
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="asaas" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">API Asaas</span>
            </TabsTrigger>
            <TabsTrigger value="cron" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Cron Jobs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="mt-6">
            <AppearanceTab />
          </TabsContent>

          <TabsContent value="asaas" className="mt-6">
            <AsaasTab />
          </TabsContent>

          <TabsContent value="cron" className="mt-6">
            <CronTab />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default Settings;
