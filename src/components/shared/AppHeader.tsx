import { Bell, Moon, Sun, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { MobileMenu } from "./MobileMenu";
import { MenuItem } from "./AppLayout";
import { getMenuItemsByRole } from "@/config/companyMenuItems";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type AppHeaderProps = {
  title: string;
  badge?: string;
  menuItems?: MenuItem[];
};

export const AppHeader = ({ title, badge, menuItems = [] }: AppHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { roles } = useRole();
  const navigate = useNavigate();
  
  // Filtrar itens do menu baseado no role do usuário
  const filteredMenuItems = getMenuItemsByRole(roles);
  
  const getRoleBadge = () => {
    if (roles.includes("admin") || roles.includes("superadmin")) {
      return { label: "Admin", color: "bg-blue-500" };
    }
    if (roles.includes("viewer")) {
      return { label: "Visualização", color: "bg-green-500" };
    }
    return null;
  };
  
  const roleBadge = getRoleBadge();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <MobileMenu menuItems={filteredMenuItems} />
          
          <h1 className="text-lg font-bold">{title}</h1>
          {badge && (
            <Badge variant="secondary" className="text-xs font-normal px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-destructive rounded-full" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Notificações</h4>
                <p className="text-xs text-muted-foreground">
                  Nenhuma notificação no momento
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-medium">Minha Conta</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  {roleBadge && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${roleBadge.color} mr-1`} />
                        {roleBadge.label}
                      </Badge>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};