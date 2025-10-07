import { AppLayout } from "@/components/shared/AppLayout";
import { companyMenuItems } from "@/config/companyMenuItems";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Payable() {
  return (
    <AppLayout menuItems={companyMenuItems} headerTitle="Contas a Pagar">
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            Funcionalidade em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
