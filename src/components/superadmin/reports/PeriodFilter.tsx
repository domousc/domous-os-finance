import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "1y";

interface PeriodFilterProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "1y", label: "1 ano" },
];

export const PeriodFilter = ({ period, onPeriodChange }: PeriodFilterProps) => {
  return (
    <div className="flex items-center gap-3 p-1 bg-muted/50 rounded-lg w-fit animate-in slide-in-from-left duration-500">
      <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={period === p.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onPeriodChange(p.value)}
          className="transition-all duration-300 hover-scale"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
};
