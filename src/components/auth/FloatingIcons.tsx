import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Wallet, 
  CreditCard,
  LineChart,
  CircleDollarSign 
} from "lucide-react";

interface FloatingIcon {
  id: number;
  Icon: any;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

export const FloatingIcons = () => {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);

  const iconComponents = [
    TrendingUp,
    DollarSign,
    PieChart,
    BarChart3,
    Wallet,
    CreditCard,
    LineChart,
    CircleDollarSign,
  ];

  useEffect(() => {
    const newIcons: FloatingIcon[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      Icon: iconComponents[Math.floor(Math.random() * iconComponents.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 24 + 32,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
    }));
    setIcons(newIcons);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon) => {
        const IconComponent = icon.Icon;
        return (
          <div
            key={icon.id}
            className="absolute animate-float-icon opacity-20 hover:opacity-40 transition-opacity"
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              width: `${icon.size}px`,
              height: `${icon.size}px`,
              animationDuration: `${icon.duration}s`,
              animationDelay: `${icon.delay}s`,
              transform: `rotate(${icon.rotation}deg)`,
            }}
          >
            <IconComponent 
              className="w-full h-full text-white/30" 
              strokeWidth={1.5}
            />
          </div>
        );
      })}
    </div>
  );
};
