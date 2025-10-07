import { MenuItem } from "@/components/shared/AppLayout";
import { Users, LayoutDashboard, Settings, DollarSign, Package, TrendingUp, TrendingDown } from "lucide-react";

export const companyMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: Users,
    label: "Clientes",
    path: "/dashboard/clients",
  },
  {
    icon: Package,
    label: "Serviços",
    path: "/dashboard/services",
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    path: "/dashboard/invoices",
    submenu: [
      {
        icon: TrendingUp,
        label: "A Receber",
        path: "/dashboard/invoices/receivable",
      },
      {
        icon: TrendingDown,
        label: "A Pagar",
        path: "/dashboard/invoices/payable",
      },
    ],
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/dashboard/settings",
  },
];
