import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import SuperAdmin from "./pages/superadmin/SuperAdmin";
import Plans from "./pages/superadmin/Plans";
import Subscriptions from "./pages/superadmin/Subscriptions";
import Companies from "./pages/superadmin/Companies";
import Users from "./pages/superadmin/Users";
import Reports from "./pages/superadmin/Reports";
import Settings from "./pages/superadmin/Settings";
import CompanyServices from "./pages/company/Services";
import Clients from "./pages/company/Clients";
import ClientProfile from "./pages/company/ClientProfile";
import Partners from "./pages/company/Partners";
import PartnerProfile from "./pages/company/PartnerProfile";
import Invoices from "./pages/company/Invoices";
import Receivable from "./pages/company/invoices/Receivable";
import Payable from "./pages/company/invoices/Payable";
import PersonalFinance from "./pages/company/PersonalFinance";
import Dashboard from "./pages/company/Dashboard";
import FinanceOverview from "./pages/company/FinanceOverview";
import Expenses from "./pages/company/Expenses";
import Team from "./pages/company/Team";
import SubscriptionExpired from "./pages/company/SubscriptionExpired";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente para proteger rotas de empresa contra acesso de superadmin
const CompanyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin, loading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isSuperAdmin) {
      navigate("/superadmin");
    }
  }, [loading, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <RoleProvider>
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  {/* Company Dashboard Routes - Updated */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <Dashboard />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/services"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <CompanyServices />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/clients"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <Clients />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/clients/:id"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <ClientProfile />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/partners"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <Partners />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/partners/:id"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <PartnerProfile />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/invoices"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <Invoices />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
              <Route
                path="/dashboard/finance/overview"
                element={
                  <ProtectedRoute>
                    <CompanyRoute>
                      <FinanceOverview />
                    </CompanyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/invoices/receivable"
                element={
                  <ProtectedRoute>
                    <CompanyRoute>
                      <Receivable />
                    </CompanyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/invoices/payable"
                element={
                  <ProtectedRoute>
                    <CompanyRoute>
                      <Payable />
                    </CompanyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/finance/expenses"
                element={
                  <ProtectedRoute>
                    <CompanyRoute>
                      <Expenses />
                    </CompanyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/finance/team"
                element={
                  <ProtectedRoute>
                    <CompanyRoute>
                      <Team />
                    </CompanyRoute>
                  </ProtectedRoute>
                }
              />
            <Route
              path="/dashboard/personal-finance"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <PersonalFinance />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/subscription-expired"
              element={
                <ProtectedRoute>
                  <CompanyRoute>
                    <SubscriptionExpired />
                  </CompanyRoute>
                </ProtectedRoute>
              }
            />
                  
                  {/* SuperAdmin Routes */}
              <Route path="/superadmin" element={<SuperAdmin />} />
              <Route path="/superadmin/plans" element={<Plans />} />
              <Route path="/superadmin/subscriptions" element={<Subscriptions />} />
              <Route path="/superadmin/companies" element={<Companies />} />
              <Route path="/superadmin/users" element={<Users />} />
              <Route path="/superadmin/reports" element={<Reports />} />
              <Route path="/superadmin/settings" element={<Settings />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SubscriptionProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
