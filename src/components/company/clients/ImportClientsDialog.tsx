import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface ImportClientsDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ClientImportData {
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
  razao_social?: string;
  nome_responsavel?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
}

export function ImportClientsDialog({ open, onClose, onImportComplete }: ImportClientsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        nome: "Exemplo Cliente",
        email: "cliente@exemplo.com",
        telefone: "(11) 98765-4321",
        cpf: "123.456.789-00",
        cnpj: "",
        razao_social: "",
        nome_responsavel: "",
        endereco: "Rua Exemplo, 123",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234-567",
        observacoes: "Cliente exemplo"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo_importacao_clientes.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para importar",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ClientImportData[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("A planilha está vazia");
      }

      // Get company_id from user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      // Prepare clients data
      const clients = jsonData.map((row) => ({
        company_id: profile.company_id,
        name: row.nome,
        email: row.email || null,
        phone: row.telefone || null,
        cpf: row.cpf || null,
        cnpj: row.cnpj || null,
        company_name: row.razao_social || null,
        responsible_name: row.nome_responsavel || null,
        address: row.endereco || null,
        city: row.cidade || null,
        state: row.estado || null,
        zip_code: row.cep || null,
        notes: row.observacoes || null,
        status: "active",
      }));

      // Insert clients
      const { error } = await supabase
        .from("clients")
        .insert(clients);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${clients.length} cliente(s) importado(s) com sucesso`,
      });

      setFile(null);
      onImportComplete();
      onClose();
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast({
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Faça upload de uma planilha Excel (.xlsx) ou CSV com os dados dos clientes.
            </p>
            
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo de Planilha
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block">
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{file.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar ou arraste um arquivo
                  </p>
                )}
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
