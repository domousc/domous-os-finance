import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export type MenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  submenu?: MenuItem[];
};

type AppLayoutProps = {
  children: ReactNode;
  menuItems: MenuItem[];
  headerTitle: string;
  headerBadge?: string;
};

export const AppLayout = ({
  children,
  menuItems,
  headerTitle,
  headerBadge,
}: AppLayoutProps) => {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full">
          <AppHeader title={headerTitle} badge={headerBadge} />

          <div className="flex flex-1 overflow-hidden w-full">
            <AppSidebar menuItems={menuItems} />

            <main className="flex-1 overflow-y-auto bg-background">
              <div className="container mx-auto p-6">{children}</div>
            </main>
          </div>

          <AppFooter />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};
