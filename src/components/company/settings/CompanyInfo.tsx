import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export const CompanyInfo = () => {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Informações da Empresa</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Em breve você poderá gerenciar as informações da sua empresa aqui.
        </div>
      </CardContent>
    </Card>
  );
};
