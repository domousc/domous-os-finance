import { AppLayout } from "@/components/shared/AppLayout";
import { MenuItem } from "@/components/shared/AppLayout";
import { Users, LayoutDashboard, Settings, DollarSign, Package } from "lucide-react";
import { InvoicesHeader } from "@/components/company/invoices/InvoicesHeader";
import { InvoicesTable } from "@/components/company/invoices/InvoicesTable";
import { InvoicesStats } from "@/components/company/invoices/InvoicesStats";

const menuItems: MenuItem[] = [
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
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/dashboard/settings",
  },
];

export default function Invoices() {
  return (
    <AppLayout menuItems={menuItems} headerTitle="Contas a Receber">
      <div className="space-y-6">
        <InvoicesStats />
        <InvoicesHeader />
        <InvoicesTable />
      </div>
    </AppLayout>
  );
}
