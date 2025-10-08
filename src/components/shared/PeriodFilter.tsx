import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type Period = "7d" | "30d" | "90d" | "6m" | "1y" | "all" | "custom";

export interface CustomDateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface PeriodFilterProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  customRange?: CustomDateRange;
  onCustomRangeChange?: (range: CustomDateRange) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
  { value: "all", label: "Tudo" },
];

export const PeriodFilter = ({ 
  period, 
  onPeriodChange,
  customRange,
  onCustomRangeChange 
}: PeriodFilterProps) => {
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: customRange?.from,
    to: customRange?.to,
  });

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      setDate(range);
      if (range.from && range.to && onCustomRangeChange) {
        onCustomRangeChange(range);
        onPeriodChange("custom");
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-1 bg-muted/50 rounded-lg w-fit ml-auto animate-in slide-in-from-right duration-500">
      <CalendarIcon className="h-4 w-4 text-muted-foreground ml-2" />
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
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={period === "custom" ? "default" : "ghost"}
            size="sm"
            className="transition-all duration-300"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            {period === "custom" && date.from && date.to
              ? `${format(date.from, "dd/MM", { locale: ptBR })} - ${format(date.to, "dd/MM", { locale: ptBR })}`
              : "Personalizado"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
