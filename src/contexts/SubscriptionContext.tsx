import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useRole } from "./RoleContext";

type SubscriptionStatus = "active" | "trial" | "expired" | "canceled" | "none";

type Subscription = {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  payment_method: string | null;
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  max_users: number;
  max_companies: number | null;
  features: any;
};

type SubscriptionContextType = {
  subscription: Subscription | null;
  plan: Plan | null;
  status: SubscriptionStatus;
  daysRemaining: number | null;
  loading: boolean;
  hasActiveSubscription: boolean;
  isTrialExpired: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();

  useEffect(() => {
    console.log("[SubscriptionContext] Effect triggered", { user: !!user, isSuperAdmin, roleLoading });
    
    // CRITICAL: Verificação de superadmin ANTES de qualquer coisa
    if (!roleLoading) {
      if (isSuperAdmin) {
        console.log("[SubscriptionContext] User is superadmin - no subscription needed");
        // Superadmin não precisa de assinatura
        setSubscription(null);
        setPlan(null);
        setLoading(false);
        return;
      }
    }

    // Se ainda está carregando role, espera
    if (roleLoading) {
      console.log("[SubscriptionContext] Waiting for role to load...");
      return;
    }

    // Se não tem usuário, limpa tudo
    if (!user) {
      console.log("[SubscriptionContext] No user - clearing subscription data");
      setSubscription(null);
      setPlan(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      console.log("[SubscriptionContext] Fetching subscription for user:", user.id);
      try {
        // Get user's company_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        console.log("[SubscriptionContext] User profile:", profile);

        if (!profile?.company_id) {
          console.log("[SubscriptionContext] No company_id found");
          setLoading(false);
          return;
        }

        // Get company's subscription
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log("[SubscriptionContext] Subscription data:", subscriptionData);
        setSubscription(subscriptionData);

        // Get plan details if subscription exists
        if (subscriptionData?.plan_id) {
          const { data: planData } = await supabase
            .from("plans")
            .select("*")
            .eq("id", subscriptionData.plan_id)
            .single();

          console.log("[SubscriptionContext] Plan data:", planData);
          setPlan(planData);
        }
      } catch (error) {
        console.error("[SubscriptionContext] Error fetching subscription:", error);
      } finally {
        console.log("[SubscriptionContext] Loading complete");
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, isSuperAdmin, roleLoading]);

  const getStatus = (): SubscriptionStatus => {
    if (!subscription) return "none";

    const now = new Date();
    
    if (subscription.status === "canceled") return "canceled";
    
    if (subscription.status === "trial") {
      if (subscription.trial_end_date && new Date(subscription.trial_end_date) < now) {
        return "expired";
      }
      return "trial";
    }

    if (subscription.status === "active") {
      if (subscription.end_date && new Date(subscription.end_date) < now) {
        return "expired";
      }
      return "active";
    }

    return "none";
  };

  const getDaysRemaining = (): number | null => {
    if (!subscription) return null;

    const now = new Date();
    let endDate: Date | null = null;

    if (subscription.status === "trial" && subscription.trial_end_date) {
      endDate = new Date(subscription.trial_end_date);
    } else if (subscription.end_date) {
      endDate = new Date(subscription.end_date);
    }

    if (!endDate) return null;

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const status = getStatus();
  const daysRemaining = getDaysRemaining();
  const hasActiveSubscription = status === "active" || status === "trial";
  const isTrialExpired = status === "trial" && (daysRemaining === 0 || daysRemaining === null);

  console.log("[SubscriptionContext] Final values:", { 
    status, 
    daysRemaining, 
    hasActiveSubscription, 
    loading,
    subscription: !!subscription 
  });

  const value = {
    subscription,
    plan,
    status,
    daysRemaining,
    loading,
    hasActiveSubscription,
    isTrialExpired,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
