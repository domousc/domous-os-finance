import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SuperAdminHeader } from "./SuperAdminHeader";
import { SuperAdminFooter } from "./SuperAdminFooter";
import {
  LayoutDashboard,
  Package,
  FileText,
  Building2,
  Users,
  Briefcase,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/superadmin" },
  { icon: Package, label: "Planos", path: "/superadmin/plans" },
  { icon: FileText, label: "Assinaturas", path: "/superadmin/subscriptions" },
  { icon: Building2, label: "Empresas", path: "/superadmin/companies" },
  { icon: Users, label: "Usuários", path: "/superadmin/users" },
  { icon: Briefcase, label: "Serviços", path: "/superadmin/services" },
  { icon: BarChart3, label: "Relatórios", path: "/superadmin/reports" },
  { icon: Settings, label: "Configurações", path: "/superadmin/settings" },
];

export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SuperAdminHeader />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar com hover */}
        <TooltipProvider>
          <aside
            className={`${
              isHovered ? "w-64" : "w-16"
            } bg-card border-r border-border transition-all duration-300 flex flex-col overflow-hidden`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Menu */}
            <nav className="flex-1 p-3 space-y-1 mt-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = window.location.pathname === item.path;
                
                return !isHovered ? (
                  <Tooltip key={item.path} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-center px-0 h-11"
                        onClick={() => navigate(item.path)}
                      >
                        <Icon className="w-6 h-6 flex-shrink-0 stroke-[1.5]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0 stroke-[1.5]" />
                    <span className="whitespace-nowrap animate-in fade-in-50 duration-200">
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </nav>
          </aside>
        </TooltipProvider>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>

      <SuperAdminFooter />
    </div>
  );
};
