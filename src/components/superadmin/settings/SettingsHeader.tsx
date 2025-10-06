import { Settings } from "lucide-react";

export const SettingsHeader = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Settings className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações globais da plataforma
        </p>
      </div>
    </div>
  );
};
