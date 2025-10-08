import { subDays, subMonths, subYears, differenceInDays, differenceInMonths, differenceInYears, eachMonthOfInterval, eachYearOfInterval } from "date-fns";
import type { Period } from "@/components/shared/PeriodFilter";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const calculateDateRange = (period: Period): DateRange => {
  const today = new Date();
  
  switch (period) {
    case "7d":
      return { start: subDays(today, 7), end: today };
    case "30d":
      return { start: subDays(today, 30), end: today };
    case "90d":
      return { start: subDays(today, 90), end: today };
    case "6m":
      return { start: subMonths(today, 6), end: today };
    case "1y":
      return { start: subYears(today, 1), end: today };
    case "all":
      return { start: null, end: null };
    default:
      return { start: subDays(today, 30), end: today };
  }
};

export const calculateComparisonRange = (period: Period): DateRange => {
  const currentRange = calculateDateRange(period);
  
  if (!currentRange.start || !currentRange.end) {
    return { start: null, end: null };
  }
  
  const days = differenceInDays(currentRange.end, currentRange.start);
  
  return {
    start: subDays(currentRange.start, days),
    end: currentRange.start,
  };
};

export const countRecurrenceInPeriod = (
  billingCycle: "monthly" | "annual" | "one_time",
  startDate: Date | null,
  endDate: Date | null
): number => {
  if (!startDate || !endDate) return 1;
  
  if (billingCycle === "one_time") return 1;
  
  if (billingCycle === "monthly") {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.length;
  }
  
  if (billingCycle === "annual") {
    const years = eachYearOfInterval({ start: startDate, end: endDate });
    return years.length;
  }
  
  return 1;
};

export const formatComparison = (current: number, previous: number, isExpense: boolean = false): { 
  text: string; 
  color: string;
  icon: string;
} => {
  const diff = current - previous;
  const percentChange = previous === 0 ? 0 : (diff / previous) * 100;
  
  if (diff === 0) {
    return {
      text: `→ Sem mudança vs período anterior`,
      color: "text-muted-foreground",
      icon: "→"
    };
  }
  
  const isPositive = diff > 0;
  const color = isExpense 
    ? (isPositive ? "text-destructive" : "text-green-600")
    : (isPositive ? "text-green-600" : "text-destructive");
  
  const icon = isPositive ? "↑" : "↓";
  const sign = isPositive ? "+" : "";
  
  const formattedDiff = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(diff));
  
  return {
    text: `${icon} ${sign}${Math.abs(percentChange).toFixed(1)}% vs período anterior (${sign}${formattedDiff})`,
    color,
    icon
  };
};
