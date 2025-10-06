import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number;
  growth: number;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "orange";
  isCurrency?: boolean;
  delay?: number;
}

const colorClasses = {
  blue: "from-blue-500/20 to-blue-600/20 text-blue-600",
  green: "from-green-500/20 to-green-600/20 text-green-600",
  purple: "from-purple-500/20 to-purple-600/20 text-purple-600",
  orange: "from-orange-500/20 to-orange-600/20 text-orange-600",
};

export const StatCard = ({
  title,
  value,
  growth,
  icon: Icon,
  color,
  isCurrency = false,
  delay = 0,
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const isPositiveGrowth = growth >= 0;

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card
      className="relative group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border-2 overflow-hidden animate-in fade-in-50 slide-in-from-bottom"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {isCurrency && "R$ "}
            {displayValue.toLocaleString("pt-BR", isCurrency ? { minimumFractionDigits: 2 } : {})}
          </div>
          
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isPositiveGrowth ? "text-green-600" : "text-red-600"
          }`}>
            {isPositiveGrowth ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{Math.abs(growth).toFixed(1)}%</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          vs período anterior
        </p>

        {/* Animated progress bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(Math.abs(growth), 100)}%` }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
};
