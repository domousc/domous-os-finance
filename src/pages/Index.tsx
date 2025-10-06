import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !roleLoading && isSuperAdmin) {
      navigate("/superadmin");
    }
  }, [authLoading, roleLoading, isSuperAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-slow text-primary text-2xl font-bold">
          Carregando...
        </div>
      </div>
    );
  }

  if (!authLoading && !roleLoading && isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo, {user?.email}
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        <div className="bg-card p-8 rounded-lg border border-border">
          <p className="text-lg">Dashboard da empresa em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
