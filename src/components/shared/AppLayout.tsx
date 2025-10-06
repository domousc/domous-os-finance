import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const isActive = (path: string) => location.pathname === path;

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const active = isActive(item.path);

    return (
      <div key={item.label}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-all overflow-hidden",
                level > 0 && "ml-6"
              )}
              onClick={() => {
                if (hasSubmenu) {
                  toggleSubmenu(item.label);
                } else {
                  navigate(item.path);
                }
              }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span 
                className={cn(
                  "truncate transition-all duration-300",
                  isHovered ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}
              >
                {item.label}
              </span>
            </Button>
          </TooltipTrigger>
          {!isHovered && (
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          )}
        </Tooltip>

        {hasSubmenu && isExpanded && isHovered && (
          <div className="mt-1 space-y-1">
            {item.submenu!.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title={headerTitle} badge={headerBadge} />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            "border-r border-border bg-card transition-all duration-300 flex flex-col",
            isHovered ? "w-64" : "w-20",
            !isHovered && "overflow-hidden"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
