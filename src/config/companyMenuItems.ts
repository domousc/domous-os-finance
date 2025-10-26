import { MenuItem } from "@/components/shared/AppLayout";
import { Users, LayoutDashboard, Settings, DollarSign, Package, TrendingUp, TrendingDown, Handshake, Wallet } from "lucide-react";

type UserRole = "admin" | "viewer";

// Função para filtrar itens do menu baseado no role
export const getMenuItemsByRole = (roles: string[]): MenuItem[] => {
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  const isViewer = roles.includes("viewer");
  
  // Se é admin ou superadmin, retorna tudo
  if (isAdmin) {
    return companyMenuItems;
  }
  
  // Se é viewer, filtra apenas os permitidos
  if (isViewer) {
    return companyMenuItems.filter(item => 
      ["/dashboard", "/dashboard/clients", "/dashboard/partners", "/dashboard/personal-finance"].includes(item.path)
    );
  }
  
  // Por padrão, retorna tudo
  return companyMenuItems;
};

export const companyMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
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
  {
    icon: Package,
    label: "Despesas Operacionais",
    path: "/dashboard/finance/expenses",
  },
  {
    icon: Users,
    label: "Time",
    path: "/dashboard/finance/team",
  },
  {
    icon: Users,
    label: "Clientes",
    path: "/dashboard/clients",
  },
  {
    icon: Handshake,
    label: "Parceiros",
    path: "/dashboard/partners",
  },
  {
    icon: Package,
    label: "Serviços",
    path: "/dashboard/services",
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    path: "/dashboard/finance/overview",
  },
  {
    icon: Wallet,
    label: "Controle Pessoal",
    path: "/dashboard/personal-finance",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/dashboard/settings",
  },
];
