import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = ({ 
  loading, 
  loadingText = "Carregando...",
  children,
  disabled,
  className,
  ...props 
}: LoadingButtonProps) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn("gap-2", className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? loadingText : children}
    </Button>
  );
};
