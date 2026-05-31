import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StepIndicatorProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  completed: boolean;
  isLast: boolean;
}

const StepIndicator = ({ icon: Icon, label, active, completed, isLast }: StepIndicatorProps) => {
  return (
    <div className={cn("flex items-center", !isLast && "flex-1")}>
      <div className="flex flex-col items-center flex-1">
        {/* Circle with icon or checkmark */}
        <div
          className={cn(
            "relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold text-sm md:text-base transition-all duration-300",
            active && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110 animate-pulse-soft",
            completed && "bg-primary text-primary-foreground",
            !active && !completed && "bg-muted text-muted-foreground border-2 border-border"
          )}
        >
          {completed ? (
            <Check className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          )}

          {/* Glow effect for active step */}
          {active && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-primary/30" />
            </>
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            "mt-2 md:mt-3 text-xs md:text-sm font-medium text-center transition-colors duration-300",
            active && "text-primary font-semibold",
            completed && "text-primary",
            !active && !completed && "text-muted-foreground"
          )}
        >
          <span className="hidden sm:inline">{label}</span>
        </span>
      </div>

      {/* Connector line */}
      {!isLast && (
        <div className="flex-1 h-0.5 md:h-1 mx-2 md:mx-4 rounded-full bg-border self-center mt-[-2.5rem] md:mt-[-3rem] relative overflow-hidden">
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all duration-500 stepper-gradient",
              completed ? "w-full" : active ? "w-1/2" : "w-0"
            )}
          />
        </div>
      )}
    </div>
  );
};

export default StepIndicator;
