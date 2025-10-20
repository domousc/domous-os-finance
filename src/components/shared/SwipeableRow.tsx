import { ReactNode, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Check, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeableRowProps {
  children: ReactNode;
  onMarkAsPaid: () => void;
  onReschedule: () => void;
  disabled?: boolean;
}

export const SwipeableRow = ({ children, onMarkAsPaid, onReschedule, disabled }: SwipeableRowProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [actionTriggered, setActionTriggered] = useState<"paid" | "reschedule" | null>(null);
  const isMobile = useIsMobile();

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (!isMobile || disabled) return;
      const offset = eventData.deltaX;
      
      // Limit swipe range
      if (offset < -150) {
        setSwipeOffset(-150);
      } else if (offset > 150) {
        setSwipeOffset(150);
      } else {
        setSwipeOffset(offset);
      }
    },
    onSwiped: (eventData) => {
      if (!isMobile || disabled) return;
      
      const offset = eventData.deltaX;
      
      // Left swipe - Mark as paid
      if (offset < -80) {
        setActionTriggered("paid");
        setTimeout(() => {
          onMarkAsPaid();
          setSwipeOffset(0);
          setActionTriggered(null);
        }, 200);
      }
      // Right swipe - Reschedule
      else if (offset > 80) {
        setActionTriggered("reschedule");
        setTimeout(() => {
          onReschedule();
          setSwipeOffset(0);
          setActionTriggered(null);
        }, 200);
      } else {
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className={`flex items-center gap-2 transition-opacity ${swipeOffset > 50 ? "opacity-100" : "opacity-0"}`}>
          <div className="bg-primary text-primary-foreground p-2 rounded-full">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Reagendar</span>
        </div>
        <div className={`flex items-center gap-2 transition-opacity ${swipeOffset < -50 ? "opacity-100" : "opacity-0"}`}>
          <span className="text-sm font-medium">Marcar pago</span>
          <div className="bg-green-600 text-white p-2 rounded-full">
            <Check className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Swipeable content */}
      <div
        {...handlers}
        className={`relative transition-transform ${actionTriggered ? "duration-200" : "duration-0"}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          backgroundColor: "hsl(var(--background))",
        }}
      >
        {children}
      </div>
    </div>
  );
};
