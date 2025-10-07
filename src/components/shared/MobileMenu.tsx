import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuItem } from "./AppLayout";
import { cn } from "@/lib/utils";
import { Menu, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type MobileMenuProps = {
  menuItems: MenuItem[];
};

export const MobileMenu = ({ menuItems }: MobileMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const isActive = (path: string) => location.pathname === path;

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const active = isActive(item.path) || 
      (item.submenu?.some(sub => isActive(sub.path)));
    const Icon = item.icon;

    if (hasSubmenu) {
      return (
        <Collapsible
          key={item.label}
          open={isExpanded}
          onOpenChange={() => toggleSubmenu(item.label)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant={active ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 h-12"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 space-y-1 mt-1">
            {item.submenu!.map((subItem) => {
              const SubIcon = subItem.icon;
              const subActive = isActive(subItem.path);

              return (
                <Button
                  key={subItem.path}
                  variant={subActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-11"
                  onClick={() => handleNavigation(subItem.path)}
                >
                  <SubIcon className="h-4 w-4 shrink-0" />
                  <span>{subItem.label}</span>
                </Button>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.label}
        variant={active ? "secondary" : "ghost"}
        className="w-full justify-start gap-3 h-12"
        onClick={() => handleNavigation(item.path)}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span>{item.label}</span>
      </Button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
