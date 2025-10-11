import { Button } from "@/components/ui/button";
import { Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const TeamHeader = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerateSalaries = async () => {
    try {
      setGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('team-automation', {
        body: {},
        method: 'GET',
      });

      if (error) throw error;

      const result = data?.results;
      if (result?.salariesGenerated > 0) {
        toast.success(`${result.salariesGenerated} salário(s) gerado(s) com sucesso!`);
      } else {
        toast.info('Todos os salários do mês já foram gerados.');
      }

      if (result?.errors && result.errors.length > 0) {
        console.error('Erros durante geração:', result.errors);
        toast.warning('Alguns salários não puderam ser gerados. Verifique o console.');
      }
    } catch (error: any) {
      console.error('Erro ao gerar salários:', error);
      toast.error(error.message || 'Erro ao gerar salários');
    } finally {
      setGenerating(false);
      window.location.reload();
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie membros e pagamentos da equipe
          </p>
        </div>
      </div>
      
      <Button 
        onClick={handleGenerateSalaries}
        disabled={generating}
        size="lg"
        className="gap-2"
      >
        <Calendar className="h-4 w-4" />
        {generating ? 'Gerando...' : 'Gerar Salários do Mês'}
      </Button>
    </div>
  );
};
