import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

export type Period = "1d" | "7d" | "14d" | "1m" | "3m" | "6m" | "1y" | "custom";

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
  { value: "1d", label: "1d" },
  { value: "7d", label: "7d" },
  { value: "14d", label: "14d" },
  { value: "1m", label: "1m" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1a" },
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
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (customRange) {
      setDate({ from: customRange.from, to: customRange.to });
    }
  }, [customRange]);

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      setDate(range);
    }
  };

  const handleApplyCustomRange = () => {
    if (date.from && date.to) {
      if (onCustomRangeChange) {
        onCustomRangeChange(date);
      }
      onPeriodChange("custom");
      setIsOpen(false);
    }
  };

  const getCurrentLabel = () => {
    if (period === "custom" && date.from && date.to) {
      return `${format(date.from, "dd/MM", { locale: ptBR })} - ${format(date.to, "dd/MM", { locale: ptBR })}`;
    }
    const currentPeriod = periods.find(p => p.value === period);
    return currentPeriod?.label || "Período";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="gap-2 w-full sm:w-auto sm:ml-auto"
        >
          <CalendarIcon className="h-4 w-4" />
          {!isMobile && <span>{getCurrentLabel()}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onPeriodChange(p.value);
                  setIsOpen(false);
                }}
                className="transition-all duration-300"
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Personalizado:</p>
            <Calendar
              mode="range"
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              initialFocus
              className={cn("p-0 pointer-events-auto")}
            />
            {date.from && date.to && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {format(date.from, "dd/MM/yyyy", { locale: ptBR })} - {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <Button
                  size="sm"
                  onClick={handleApplyCustomRange}
                  className="gap-1"
                >
                  <Check className="h-3 w-3" />
                  Aplicar
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
