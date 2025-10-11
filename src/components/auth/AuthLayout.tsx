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
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0e0e0e] via-[#1a0a14] to-[#0e0e0e]">
        {/* Animated Background Image with lower opacity */}
        <div className="absolute inset-0">
          <img
            src={authHero}
            alt="Domous OS"
            className="w-full h-full object-cover opacity-10 scale-105 animate-slow-zoom"
          />
        </div>

        {/* Floating Financial Icons */}
        <FloatingIcons />

        {/* Floating Particles */}
        <AnimatedParticles />

        {/* Large Circular Gradient Element - Right Side */}
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px]">
          <div className="relative w-full h-full">
            {/* Main gradient circle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-3xl animate-pulse-slow" />
            {/* Curved line effect */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin-slow" style={{ animationDuration: '20s' }} />
            {/* Inner glow */}
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-primary/50 blur-2xl animate-pulse-glow" />
          </div>
        </div>

        {/* Trending Up Icon - Top Right */}
        <div className="absolute top-12 right-12 text-primary animate-float-icon z-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 xl:px-24 text-white max-w-2xl">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 bg-primary/10 backdrop-blur-sm w-fit animate-fade-in-up">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span className="text-sm font-medium text-primary">Sistema de Gestão Inteligente</span>
          </div>

          {/* Main Heading */}
          <div className="mb-6 space-y-2">
            <h1 className="text-5xl xl:text-6xl font-bold leading-tight animate-slide-in-left">
              Transforme sua
            </h1>
            <h1 className="text-5xl xl:text-6xl font-bold leading-tight text-primary animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              Gestão Empresarial
            </h1>
          </div>
          
          {/* Subtitle with icon */}
          <div className="flex items-start gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary mt-1 flex-shrink-0">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <p className="text-lg xl:text-xl text-white/80 leading-relaxed">
              Controle financeiro, CRM completo, comissionamento inteligente e muito mais em uma plataforma unificada.
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="space-y-1">
              <div className="text-4xl font-bold text-primary">100+</div>
              <div className="text-sm text-white/60">Empresas</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-sm text-white/60">Disponibilidade</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-bold text-primary">∞</div>
              <div className="text-sm text-white/60">Possibilidades</div>
            </div>
          </div>

          {/* Users Icon - Bottom */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/60">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[#0e0e0e] relative">
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
