import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  FileText,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/superadmin" },
  { icon: Package, label: "Planos", path: "/superadmin/plans" },
  { icon: FileText, label: "Assinaturas", path: "/superadmin/subscriptions" },
  { icon: Building2, label: "Empresas", path: "/superadmin/companies" },
  { icon: Users, label: "Usuários", path: "/superadmin/users" },
  { icon: BarChart3, label: "Relatórios", path: "/superadmin/reports" },
  { icon: Settings, label: "Configurações", path: "/superadmin/settings" },
];

export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-primary">Domous OS</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  !isSidebarOpen && "justify-center px-2"
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className={`mb-3 ${!isSidebarOpen && "text-center"}`}>
            {isSidebarOpen && (
              <div className="text-sm">
                <p className="font-medium text-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className={`w-full gap-2 ${!isSidebarOpen && "justify-center px-2"}`}
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};
