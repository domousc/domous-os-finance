import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { MenuItem } from "./AppLayout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  menuItems: MenuItem[];
};

export const AppSidebar = ({ menuItems }: AppSidebarProps) => {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const hasActiveSubmenuItem = (item: MenuItem) => {
    if (!item.submenu) return false;
    return item.submenu.some((subItem) => isActive(subItem.path));
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const active = isActive(item.path);
    const hasActiveChild = hasActiveSubmenuItem(item);
    const shouldBeOpen = hasActiveChild && !collapsed;

    if (hasSubmenu) {
      return (
        <Collapsible key={item.label} defaultOpen={shouldBeOpen} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={collapsed ? item.label : undefined}
                className={cn(
                  "w-full",
                  hasActiveChild && "bg-muted text-primary font-medium"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            {!collapsed && (
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.submenu!.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.label}>
                      <SidebarMenuSubButton asChild isActive={isActive(subItem.path)}>
                        <NavLink to={subItem.path}>
                          <subItem.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{subItem.label}</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            )}
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.label}>
        <SidebarMenuButton asChild tooltip={collapsed ? item.label : undefined} isActive={active}>
          <NavLink to={item.path}>
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className={collapsed ? "w-20" : "w-64"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{menuItems.map((item) => renderMenuItem(item))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
