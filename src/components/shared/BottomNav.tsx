import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MenuItem } from "./AppLayout";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";
import { useState } from "react";

type BottomNavProps = {
  menuItems: MenuItem[];
};

export const BottomNav = ({ menuItems }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  const isActive = (path: string) => location.pathname === path;

  // Pega apenas os 4 primeiros itens principais
  const mainItems = menuItems.slice(0, 4);

  const handleItemClick = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      setSelectedMenu(item);
      setOpen(true);
    } else {
      navigate(item.path);
    }
  };

  const handleSubmenuClick = (path: string) => {
    navigate(path);
    setOpen(false);
    setSelectedMenu(null);
  };

  return (
    <>
      {/* Bottom Navigation Bar - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-around h-16 px-2">
          {mainItems.map((item) => {
            const active = isActive(item.path) || 
              (item.submenu?.some(sub => isActive(sub.path)));
            const Icon = item.icon;

            return (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-14 flex-1 rounded-lg",
                  active && "bg-primary/10 text-primary"
                )}
                onClick={() => handleItemClick(item)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Drawer para Submenu */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                {selectedMenu?.icon && <selectedMenu.icon className="h-5 w-5" />}
                {selectedMenu?.label}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          
          <div className="px-4 pb-6 space-y-1">
            {selectedMenu?.submenu?.map((subItem) => {
              const SubIcon = subItem.icon;
              const active = isActive(subItem.path);

              return (
                <Button
                  key={subItem.path}
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => handleSubmenuClick(subItem.path)}
                >
                  <SubIcon className="h-5 w-5" />
                  <span>{subItem.label}</span>
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Spacer para compensar a altura da bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
};
