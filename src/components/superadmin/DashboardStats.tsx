import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Users, FileText, Package } from "lucide-react";

interface Stats {
  companies: number;
  users: number;
  subscriptions: number;
  plans: number;
}

export const DashboardStats = () => {
  const [stats, setStats] = useState<Stats>({
    companies: 0,
    users: 0,
    subscriptions: 0,
    plans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: companiesCount },
          { count: usersCount },
          { count: subscriptionsCount },
          { count: plansCount },
        ] = await Promise.all([
          supabase.from("companies").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("subscriptions").select("*", { count: "exact", head: true }),
          supabase.from("plans").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          companies: companiesCount || 0,
          users: usersCount || 0,
          subscriptions: subscriptionsCount || 0,
          plans: plansCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Empresas",
      value: stats.companies,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Usuários",
      value: stats.users,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Assinaturas",
      value: stats.subscriptions,
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Planos",
      value: stats.plans,
      icon: Package,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Painel de Super Admin
        </h1>
        <p className="text-muted-foreground">
          Visão geral do sistema multi-tenant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Bem-vindo ao Painel Super Admin
        </h2>
        <p className="text-muted-foreground mb-6">
          Gerencie planos, assinaturas, empresas e usuários do sistema Domous OS.
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-foreground mb-2">
              🎯 Próximos passos
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Gerencie planos de assinatura</li>
              <li>• Cadastre empresas no sistema</li>
              <li>• Configure permissões de usuários</li>
              <li>• Visualize relatórios e métricas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
