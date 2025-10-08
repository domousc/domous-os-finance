import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const paymentSchema = z.object({
  team_member_id: z.string().min(1, "Membro é obrigatório"),
  payment_type: z.enum(["bonus", "commission", "service"]),
  description: z.string().optional(),
  amount: z.string().min(1, "Valor é obrigatório"),
  reference_month: z.string().optional(),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface TeamPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  payment?: any;
}

export const TeamPaymentDialog = ({ open, onClose, payment }: TeamPaymentDialogProps) => {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_type: "bonus",
    },
  });

  const { data: members } = useQuery({
    queryKey: ["team-members-active"],
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
        .from("team_members")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("status", "active")
        .order("name");

      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (payment) {
      reset({
        team_member_id: payment.team_member_id,
        payment_type: payment.payment_type,
        description: payment.description,
        amount: payment.amount.toString(),
        reference_month: payment.reference_month,
        due_date: payment.due_date.split('T')[0],
        notes: payment.notes || "",
      });
    } else {
      const today = new Date();
      const currentMonth = today.toISOString().split('T')[0].substring(0, 7) + '-01';
      reset({
        payment_type: "bonus",
        reference_month: currentMonth,
      });
    }
  }, [payment, reset]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("No company");

      const paymentData: any = {
        team_member_id: data.team_member_id,
        payment_type: data.payment_type,
        description: data.description || null,
        reference_month: data.reference_month || null,
        notes: data.notes || null,
        company_id: profile.company_id,
        amount: parseFloat(data.amount),
        due_date: new Date(data.due_date).toISOString(),
        status: "pending",
      };

      if (payment) {
        await supabase
          .from("team_payments")
          .update(paymentData)
          .eq("id", payment.id);
        toast.success("Pagamento atualizado com sucesso!");
      } else {
        await supabase
          .from("team_payments")
          .insert([paymentData]);
        toast.success("Pagamento criado com sucesso!");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Editar Pagamento" : "Novo Pagamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Membro *</Label>
            <Select
              onValueChange={(value) => setValue("team_member_id", value)}
              defaultValue={payment?.team_member_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.team_member_id && (
              <p className="text-sm text-destructive">{errors.team_member_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de Pagamento *</Label>
            <Select
              onValueChange={(value) => setValue("payment_type", value as "bonus" | "commission" | "service")}
              defaultValue={payment?.payment_type || "bonus"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bonus">Bonificação</SelectItem>
                <SelectItem value="commission">Comissão</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input {...register("description")} placeholder="Ex: Serviço de design" />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Input type="date" {...register("due_date")} />
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mês de Referência</Label>
            <Input type="month" {...register("reference_month")} />
            {errors.reference_month && (
              <p className="text-sm text-destructive">{errors.reference_month.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea {...register("notes")} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {payment ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
