export const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border bg-card py-4 px-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>© {currentYear} Domous OS. Todos os direitos reservados.</p>
        <p>Versão 1.0.0</p>
      </div>
    </footer>
  );
};
