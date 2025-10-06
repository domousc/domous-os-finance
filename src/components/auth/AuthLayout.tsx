import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary to-primary/80">
        <div className="absolute inset-0">
          <img
            src={authHero}
            alt="Domous OS"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-primary/30" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 xl:px-24 text-white animate-slide-in-left">
          <div className="mb-8">
            <h1 className="text-5xl xl:text-6xl font-bold mb-4 tracking-tight">
              Domous OS
            </h1>
            <div className="w-20 h-1 bg-white/80 rounded-full" />
          </div>
          
          <p className="text-xl xl:text-2xl font-light leading-relaxed max-w-lg">
            Transforme a gestão financeira da sua empresa com inteligência e simplicidade.
          </p>
          
          <div className="mt-12 space-y-4 text-white/80">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
              <p className="text-lg">Controle total em tempo real</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
              <p className="text-lg">Multi-tenant e escalável</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
              <p className="text-lg">Segurança de nível empresarial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background relative">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="absolute top-6 right-6 p-3 rounded-full glass-effect hover:bg-primary/10 transition-all duration-300 group"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          ) : (
            <Sun className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          )}
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6">
          <h2 className="text-2xl font-bold text-primary">Domous OS</h2>
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
