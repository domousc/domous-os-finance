import { subDays, subMonths, subYears, addDays, addMonths, addYears, differenceInDays, differenceInMonths, differenceInYears, eachMonthOfInterval, eachYearOfInterval } from "date-fns";
import type { Period } from "@/components/shared/PeriodFilter";

export type { Period };

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const getDateRangeFilter = (period: Period): { start: string; end: string } => {
  const range = calculateDateRange(period);
  return {
    start: range.start?.toISOString() || new Date(0).toISOString(),
    end: range.end?.toISOString() || new Date().toISOString(),
  };
};

// Para dados históricos (passado) - usado em Despesas
export const calculateDateRange = (period: Period): DateRange => {
  const today = new Date();
  
  switch (period) {
    case "1d":
      return { start: subDays(today, 1), end: today };
    case "7d":
      return { start: subDays(today, 7), end: today };
    case "14d":
      return { start: subDays(today, 14), end: today };
    case "1m":
      return { start: subMonths(today, 1), end: today };
    case "3m":
      return { start: subMonths(today, 3), end: today };
    case "6m":
      return { start: subMonths(today, 6), end: today };
    case "1y":
      return { start: subYears(today, 1), end: today };
    case "custom":
      return { start: today, end: today };
    default:
      return { start: subMonths(today, 1), end: today };
  }
};

// Para dados futuros (contas a pagar) - usado em À Pagar
export const calculateFutureDateRange = (period: Period): DateRange => {
  const today = new Date();
  
  switch (period) {
    case "1d":
      return { start: today, end: addDays(today, 1) };
    case "7d":
      return { start: today, end: addDays(today, 7) };
    case "14d":
      return { start: today, end: addDays(today, 14) };
    case "1m":
      return { start: today, end: addMonths(today, 1) };
    case "3m":
      return { start: today, end: addMonths(today, 3) };
    case "6m":
      return { start: today, end: addMonths(today, 6) };
    case "1y":
      return { start: today, end: addYears(today, 1) };
    case "custom":
      return { start: today, end: today };
    default:
      return { start: today, end: addMonths(today, 1) };
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
  
  // Se a mudança for muito pequena (< 0.5%), considerar como sem mudança
  if (Math.abs(percentChange) < 0.5) {
    return {
      text: `→ Sem mudança vs período anterior`,
      color: "text-muted-foreground",
      icon: "→"
    };
  }
  
  const isPositive = diff > 0;
  
  // Para despesas: aumentos em amarelo (neutro), diminuições em verde
  // Para receitas: aumentos em verde, diminuições em vermelho
  let color: string;
  if (isExpense) {
    color = isPositive ? "text-orange-500" : "text-green-600";
  } else {
    color = isPositive ? "text-green-600" : "text-destructive";
  }
  
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
