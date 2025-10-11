import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PersonPayableFiltersProps {
  personType: "all" | "team_member" | "partner";
  onPersonTypeChange: (value: "all" | "team_member" | "partner") => void;
  sortBy: "amount" | "name" | "due_date";
  onSortByChange: (value: "amount" | "name" | "due_date") => void;
}

export function PersonPayableFilters({
  personType,
  onPersonTypeChange,
  sortBy,
  onSortByChange,
}: PersonPayableFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
        <span className="text-sm text-muted-foreground">Tipo:</span>
        <Select value={personType} onValueChange={onPersonTypeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="team_member">Equipe</SelectItem>
            <SelectItem value="partner">Parceiros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
        <span className="text-sm text-muted-foreground">Ordenar por:</span>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amount">Valor (maior)</SelectItem>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
            <SelectItem value="due_date">Próximo Vencimento</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
