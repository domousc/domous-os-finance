import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

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

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setPlan(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        // Get user's company_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (!profile?.company_id) {
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

        setSubscription(subscriptionData);

        // Get plan details if subscription exists
        if (subscriptionData?.plan_id) {
          const { data: planData } = await supabase
            .from("plans")
            .select("*")
            .eq("id", subscriptionData.plan_id)
            .single();

          setPlan(planData);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

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
