import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings } from "lucide-react";

export const CompanySettings = () => {
  const [paymentDay, setPaymentDay] = useState<string>("10");
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, refetch } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("No company");

      const { data } = await supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", profile.company_id)
        .maybeSingle();

      return data;
    },
  });

  useEffect(() => {
    if (settings?.default_payment_day) {
      setPaymentDay(settings.default_payment_day.toString());
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("No company");

      const day = parseInt(paymentDay);
      if (day < 1 || day > 31) {
        toast.error("O dia deve estar entre 1 e 31");
        return;
      }

      if (settings) {
        await supabase
          .from("company_settings")
          .update({ default_payment_day: day })
          .eq("company_id", profile.company_id);
      } else {
        await supabase
          .from("company_settings")
          .insert({
            company_id: profile.company_id,
            default_payment_day: day,
          });
      }

      toast.success("Configuração salva com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Pagamento
        </CardTitle>
        <CardDescription>
          Defina o dia padrão de pagamento para a equipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Dia de Pagamento Padrão</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              max="31"
              value={paymentDay}
              onChange={(e) => setPaymentDay(e.target.value)}
              className="max-w-[100px]"
            />
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Este será o dia padrão para pagamentos de salários (pode ser personalizado por membro)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
