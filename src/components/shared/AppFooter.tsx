import { cn } from "@/lib/utils";

export const AppFooter = ({ className }: { className?: string }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn("border-t border-border bg-card py-4 px-6", className)}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>© {currentYear} Domous OS. Todos os direitos reservados.</p>
        <p>Versão 1.0.0</p>
      </div>
    </footer>
  );
};
