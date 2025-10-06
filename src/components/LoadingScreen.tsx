import { useEffect, useState } from "react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Carregando..." }: LoadingScreenProps) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 animate-in fade-in-50 duration-500">
        {/* Animated Logo/Icon */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            <div className="h-24 w-24 rounded-full border-4 border-transparent border-t-primary/30 border-r-primary/30"></div>
          </div>
          
          {/* Middle rotating ring */}
          <div className="absolute inset-2 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}>
            <div className="h-20 w-20 rounded-full border-4 border-transparent border-t-primary/50 border-r-primary/50"></div>
          </div>
          
          {/* Inner rotating ring */}
          <div className="absolute inset-4 animate-spin" style={{ animationDuration: "1.5s" }}>
            <div className="h-16 w-16 rounded-full border-4 border-transparent border-t-primary border-r-primary"></div>
          </div>
          
          {/* Center pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-foreground">
            {message}
            <span className="inline-block w-8 text-left">{dots}</span>
          </p>
          
          {/* Progress bar */}
          <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary/50 to-primary animate-shimmer"
              style={{
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite linear"
              }}
            ></div>
          </div>
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-primary/20 rounded-full animate-float"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100px) translateX(50px) scale(1.2);
            opacity: 0.5;
          }
          90% {
            opacity: 0.3;
          }
        }

        .animate-float {
          animation: float 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
