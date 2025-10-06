import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Building2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  status: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CompaniesTableProps {
  onEditCompany: (companyId: string) => void;
}

export const CompaniesTable = ({ onEditCompany }: CompaniesTableProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCompanies(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();

    const channel = supabase
      .channel("companies-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "companies",
        },
        () => {
          fetchCompanies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir empresa",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Empresa excluída com sucesso",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 animate-in fade-in-50 duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-muted-foreground animate-pulse">
            Carregando empresas...
          </div>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl animate-in fade-in-50 duration-300 bg-muted/20">
        <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-lg font-medium">
          Nenhuma empresa cadastrada
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Clique em "Nova Empresa" para adicionar a primeira empresa
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border animate-in fade-in-50 duration-500 overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Empresa</TableHead>
            <TableHead className="font-semibold">Documento</TableHead>
            <TableHead className="font-semibold">Contato</TableHead>
            <TableHead className="font-semibold">Localização</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Cadastro</TableHead>
            <TableHead className="text-right font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company, index) => (
            <TableRow
              key={company.id}
              className="hover:bg-muted/50 transition-all duration-200 group"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "backwards",
              }}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-10 w-10 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <span className="group-hover:text-primary transition-colors">
                    {company.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {company.document || "-"}
                </span>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <div className="flex flex-col gap-1">
                    {company.email && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground truncate max-w-[150px]">
                              {company.email}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{company.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {company.phone && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {company.phone}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{company.phone}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {!company.email && !company.phone && (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                {company.city || company.state ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">
                      {[company.city, company.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={company.status === "active" ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      company.status === "active" ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  {company.status === "active" ? "Ativa" : "Inativa"}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm">
                  {format(new Date(company.created_at), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditCompany(company.id)}
                        className="hover-scale hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editar empresa</p>
                    </TooltipContent>
                  </Tooltip>
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover-scale hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir empresa</p>
                      </TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a empresa{" "}
                          <strong>{company.name}</strong>? Esta ação não pode ser
                          desfeita e todos os dados relacionados serão removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(company.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
