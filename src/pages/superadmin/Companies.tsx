import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { CompaniesHeader } from "@/components/superadmin/companies/CompaniesHeader";
import { CompaniesTable } from "@/components/superadmin/companies/CompaniesTable";
import { CompanyDialog } from "@/components/superadmin/companies/CompanyDialog";

const Companies = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isSuperAdmin) {
        navigate("/dashboard");
      }
    }
  }, [user, isSuperAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-2xl font-bold">
          Carregando...
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const handleCreateCompany = () => {
    setEditingCompanyId(null);
    setIsDialogOpen(true);
  };

  const handleEditCompany = (companyId: string) => {
    setEditingCompanyId(companyId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCompanyId(null);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <CompaniesHeader onCreateCompany={handleCreateCompany} />
        <CompaniesTable onEditCompany={handleEditCompany} />
        <CompanyDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          companyId={editingCompanyId}
        />
      </div>
    </SuperAdminLayout>
  );
};

export default Companies;
