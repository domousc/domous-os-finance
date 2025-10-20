import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PlanFeaturesProps {
  features: any[];
}

export const PlanFeatures = ({ features }: PlanFeaturesProps) => {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Recursos do Plano</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature: any, index: number) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-xs">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
