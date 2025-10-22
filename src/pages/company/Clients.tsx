import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ClientsHeader } from "@/components/company/clients/ClientsHeader";
import { ClientsTable } from "@/components/company/clients/ClientsTable";
import { ClientDialog } from "@/components/company/clients/ClientDialog";
import { ImportClientsDialog } from "@/components/company/clients/ImportClientsDialog";

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  cpf: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export default function Clients() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewClient = () => {
    setSelectedClient(undefined);
    setDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedClient(undefined);
  };

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Clientes">
      <div className="space-y-6">
        <ClientsHeader 
          onNewClient={handleNewClient}
          onImport={() => setImportDialogOpen(true)}
        />
        <ClientsTable key={refreshKey} onEditClient={handleEditClient} />
        <ClientDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          client={selectedClient}
        />
        <ImportClientsDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImportComplete={handleImportComplete}
        />
      </div>
    </AppLayout>
  );
}
