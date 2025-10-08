import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const memberSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().min(1, "Cargo é obrigatório"),
  employment_type: z.enum(["fixed", "variable"]),
  monthly_salary: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  pix_key: z.string().optional(),
  bank_name: z.string().optional(),
  bank_agency: z.string().optional(),
  bank_account: z.string().optional(),
  notes: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface TeamMemberDialogProps {
  open: boolean;
  onClose: () => void;
  member?: any;
}

export const TeamMemberDialog = ({ open, onClose, member }: TeamMemberDialogProps) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      employment_type: "variable",
    },
  });

  const employmentType = watch("employment_type");

  useEffect(() => {
    if (member) {
      reset({
        name: member.name,
        role: member.role,
        employment_type: member.employment_type,
        monthly_salary: member.monthly_salary?.toString() || "",
        email: member.email || "",
        phone: member.phone || "",
        cpf: member.cpf || "",
        pix_key: member.pix_key || "",
        bank_name: member.bank_name || "",
        bank_agency: member.bank_agency || "",
        bank_account: member.bank_account || "",
        notes: member.notes || "",
      });
    } else {
      reset({
        employment_type: "variable",
      });
    }
  }, [member, reset]);

  const onSubmit = async (data: MemberFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("No company");

      const memberData: any = {
        name: data.name,
        role: data.role,
        employment_type: data.employment_type,
        email: data.email || null,
        phone: data.phone || null,
        cpf: data.cpf || null,
        pix_key: data.pix_key || null,
        bank_name: data.bank_name || null,
        bank_agency: data.bank_agency || null,
        bank_account: data.bank_account || null,
        notes: data.notes || null,
        company_id: profile.company_id,
        monthly_salary: data.employment_type === 'fixed' && data.monthly_salary 
          ? parseFloat(data.monthly_salary) 
          : null,
      };

      if (member) {
        await supabase
          .from("team_members")
          .update(memberData)
          .eq("id", member.id);
        toast.success("Membro atualizado com sucesso!");
      } else {
        await supabase
          .from("team_members")
          .insert([memberData]);
        toast.success("Membro cadastrado com sucesso!");
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Editar Membro" : "Novo Membro"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Input {...register("role")} />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Vínculo *</Label>
              <Select
                value={employmentType}
                onValueChange={(value) => setValue("employment_type", value as "fixed" | "variable")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo (Salário Mensal)</SelectItem>
                  <SelectItem value="variable">Variável (Por Demanda)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {employmentType === 'fixed' && (
              <div className="space-y-2">
                <Label>Salário Mensal</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register("monthly_salary")}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label>CPF</Label>
              <Input {...register("cpf")} />
            </div>

            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input {...register("pix_key")} />
            </div>

            <div className="space-y-2">
              <Label>Banco</Label>
              <Input {...register("bank_name")} />
            </div>

            <div className="space-y-2">
              <Label>Agência</Label>
              <Input {...register("bank_agency")} />
            </div>

            <div className="space-y-2">
              <Label>Conta</Label>
              <Input {...register("bank_account")} />
            </div>
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
              {member ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
