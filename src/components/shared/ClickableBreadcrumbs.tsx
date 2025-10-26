import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface ClickableBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const ClickableBreadcrumbs = ({ items, className }: ClickableBreadcrumbsProps) => {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <Link 
        to="/dashboard" 
        className="hover:text-foreground transition-colors"
      >
        Início
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.path && index < items.length - 1 ? (
            <Link
              to={item.path}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              index === items.length - 1 && "text-foreground font-medium"
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
