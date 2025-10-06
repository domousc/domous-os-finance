import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import authHero from "@/assets/images/auth-hero.jpg";
import { AnimatedParticles } from "./AnimatedParticles";
import { FloatingIcons } from "./FloatingIcons";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero Image with Animations */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 animate-gradient">
        {/* Animated Background Image */}
        <div className="absolute inset-0">
          <img
            src={authHero}
            alt="Domous OS"
            className="w-full h-full object-cover opacity-30 scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-primary/50 to-black/60 animate-gradient-shift" />
        </div>

        {/* Floating Financial Icons */}
        <FloatingIcons />

        {/* Floating Particles */}
        <AnimatedParticles />

        {/* Animated Glow Effects */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/15 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 xl:px-24 text-white">
          {/* Logo and Title with Stagger Animation */}
          <div className="mb-8 space-y-4">
            <h1 className="text-5xl xl:text-6xl font-bold tracking-tight animate-slide-in-left">
              <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default">
                Domous
              </span>{" "}
              <span className="inline-block hover:scale-110 transition-transform duration-300 cursor-default text-white/90">
                OS
              </span>
            </h1>
            <div className="w-20 h-1 bg-white/80 rounded-full animate-expand" />
          </div>
          
          {/* Main Tagline */}
          <p className="text-xl xl:text-2xl font-light leading-relaxed max-w-lg mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Transforme a gestão financeira da sua empresa com{" "}
            <span className="font-semibold text-white inline-block hover:scale-105 transition-transform">
              inteligência
            </span>{" "}
            e{" "}
            <span className="font-semibold text-white inline-block hover:scale-105 transition-transform">
              simplicidade
            </span>.
          </p>
          
          {/* Feature List with Staggered Animation */}
          <div className="space-y-4">
            {[
              { text: "Controle total em tempo real", delay: "0.3s" },
              { text: "Multi-tenant e escalável", delay: "0.4s" },
              { text: "Segurança de nível empresarial", delay: "0.5s" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 group cursor-default animate-fade-in-up"
                style={{ animationDelay: item.delay }}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow group-hover:scale-150 transition-transform duration-300" />
                <p className="text-lg text-white/90 group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Decorative Elements */}
          <div className="mt-16 flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-12 h-1 bg-white/30 rounded-full hover:bg-white/60 transition-all duration-500 hover:w-20"
                style={{ animationDelay: `${0.7 + i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background relative">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="absolute top-6 right-6 p-3 rounded-full glass-effect hover:bg-primary/10 transition-all duration-300 group hover:scale-110"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors group-hover:rotate-12" />
          ) : (
            <Sun className="w-5 h-5 text-foreground group-hover:text-primary transition-colors group-hover:rotate-12" />
          )}
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-primary">Domous OS</h2>
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 animate-slide-in-right">
              {title}
            </h2>
            <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
