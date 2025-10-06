import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    
    if (!authLoading && !roleLoading) {
      hasNavigated.current = true;
      
      if (!user) {
        navigate("/login", { replace: true });
      } else if (isSuperAdmin) {
        // CRITICAL: Superadmin vai direto para /superadmin
        navigate("/superadmin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authLoading, roleLoading, isSuperAdmin, navigate]);

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

  // Não renderiza nada, apenas redireciona
  return null;
};

export default Index;
