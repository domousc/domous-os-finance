import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyTableStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyTableState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyTableStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/20 animate-in fade-in-50 duration-300",
      className
    )}>
      <Icon className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
