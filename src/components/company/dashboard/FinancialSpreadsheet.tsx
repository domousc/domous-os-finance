import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export function FinancialSpreadsheet() {
  const { user } = useAuth();

  const { data: spreadsheetData, isLoading } = useQuery({
    queryKey: ["financial-spreadsheet", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      // Get last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      // Fetch invoices (receivables)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount, due_date, status")
        .eq("company_id", profile.company_id)
        .gte("due_date", sixMonthsAgo.toISOString());

      // Fetch expenses
      const { data: expenses } = await supabase
        .from("company_expenses")
        .select("amount, due_date, status")
        .eq("company_id", profile.company_id)
        .gte("due_date", sixMonthsAgo.toISOString());

      // Fetch commissions
      const { data: commissions } = await supabase
        .from("partner_commissions")
        .select("commission_amount, scheduled_payment_date, status")
        .eq("company_id", profile.company_id)
        .gte("scheduled_payment_date", sixMonthsAgo.toISOString());

      // Group by month
      const monthlyData: { [key: string]: any } = {};

      invoices?.forEach((invoice) => {
        const date = new Date(invoice.due_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { 
            month: monthLabel, 
            receitas: 0, 
            despesas: 0, 
            comissoes: 0,
            saldo: 0 
          };
        }

        if (invoice.status === "paid") {
          monthlyData[monthKey].receitas += Number(invoice.amount);
        }
      });

      expenses?.forEach((expense) => {
        const date = new Date(expense.due_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { 
            month: monthLabel, 
            receitas: 0, 
            despesas: 0, 
            comissoes: 0,
            saldo: 0 
          };
        }

        if (expense.status === "paid") {
          monthlyData[monthKey].despesas += Number(expense.amount);
        }
      });

      commissions?.forEach((commission) => {
        const date = new Date(commission.scheduled_payment_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { 
            month: monthLabel, 
            receitas: 0, 
            despesas: 0, 
            comissoes: 0,
            saldo: 0 
          };
        }

        if (commission.status === "paid") {
          monthlyData[monthKey].comissoes += Number(commission.commission_amount);
        }
      });

      // Calculate balance
      Object.keys(monthlyData).forEach(key => {
        const data = monthlyData[key];
        data.saldo = data.receitas - data.despesas - data.comissoes;
      });

      return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planilha Financeira - Últimos 6 Meses</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Mês</TableHead>
                  <TableHead className="text-right font-bold">Receitas</TableHead>
                  <TableHead className="text-right font-bold">Despesas</TableHead>
                  <TableHead className="text-right font-bold">Comissões</TableHead>
                  <TableHead className="text-right font-bold">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spreadsheetData?.map((row: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium capitalize">{row.month}</TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {formatCurrency(row.receitas)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {formatCurrency(row.despesas)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 font-semibold">
                      {formatCurrency(row.comissoes)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${row.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(row.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
