import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export type Period = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

interface PeriodFilterProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
  { value: "all", label: "Tudo" },
];

export const PeriodFilter = ({ period, onPeriodChange }: PeriodFilterProps) => {
  return (
    <div className="flex items-center gap-3 p-1 bg-muted/50 rounded-lg w-fit ml-auto animate-in slide-in-from-right duration-500">
      <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={period === p.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onPeriodChange(p.value)}
          className="transition-all duration-300"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
};
