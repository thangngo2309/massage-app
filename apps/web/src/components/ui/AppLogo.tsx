import { Flower2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  compact?: boolean;
  className?: string;
};

export const AppLogo = ({ compact = false, className }: AppLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
        <Flower2 className="size-6" />
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="text-[17px] font-bold tracking-tight text-slate-950">
            Massage
          </div>

          <div className="-mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
            Booking
          </div>
        </div>
      )}
    </div>
  );
};
