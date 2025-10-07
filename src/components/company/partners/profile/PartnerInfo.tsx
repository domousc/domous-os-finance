import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PartnerInfoProps {
  partnerId: string;
}

export function PartnerInfo({ partnerId }: PartnerInfoProps) {
  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("id", partnerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Carregando...</div>;
  if (!partner) return <div>Parceiro não encontrado</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{partner.name}</CardTitle>
          <Badge variant={partner.status === "active" ? "default" : "secondary"}>
            {partner.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p>{partner.email || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p>{partner.phone || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CPF</p>
            <p>{partner.cpf || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CNPJ</p>
            <p>{partner.cnpj || "-"}</p>
          </div>
        </div>

        {(partner.bank_name || partner.pix_key) && (
          <>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Dados Bancários</h4>
              <div className="grid grid-cols-2 gap-4">
                {partner.bank_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Banco</p>
                    <p>{partner.bank_name}</p>
                  </div>
                )}
                {partner.bank_agency && (
                  <div>
                    <p className="text-sm text-muted-foreground">Agência</p>
                    <p>{partner.bank_agency}</p>
                  </div>
                )}
                {partner.bank_account && (
                  <div>
                    <p className="text-sm text-muted-foreground">Conta</p>
                    <p>{partner.bank_account}</p>
                  </div>
                )}
                {partner.pix_key && (
                  <div>
                    <p className="text-sm text-muted-foreground">Chave PIX</p>
                    <p>{partner.pix_key}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {partner.notes && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Observações</p>
            <p className="whitespace-pre-wrap">{partner.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
