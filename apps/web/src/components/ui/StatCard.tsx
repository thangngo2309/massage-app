import { LucideIcon } from "lucide-react";

import { Card } from "./Card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  className?: string;
};

export const StatCard = ({
  label,
  value,
  helper,
  icon: Icon,
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("flex items-center gap-4 p-4 sm:p-5", className)}>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0">
        <div className="text-sm text-slate-500">{label}</div>

        <div className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </div>

        {helper && <div className="mt-1 text-xs text-slate-400">{helper}</div>}
      </div>
    </Card>
  );
};
