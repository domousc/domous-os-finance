import { useState } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { ClientsHeader } from "@/components/company/clients/ClientsHeader";
import { ClientsTable } from "@/components/company/clients/ClientsTable";
import { ClientDialog } from "@/components/company/clients/ClientDialog";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
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
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

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

  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Clientes">
      <div className="space-y-6">
        <ClientsHeader onNewClient={handleNewClient} />
        <ClientsTable onEditClient={handleEditClient} />
        <ClientDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          client={selectedClient}
        />
      </div>
    </AppLayout>
  );
}
