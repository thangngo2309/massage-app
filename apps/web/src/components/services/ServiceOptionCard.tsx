import { ArrowRight, Check, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { formatCurrency, formatDuration } from "@/lib/utils";

import type { ServiceOption } from "@/types/service";

type ServiceOptionCardProps = {
  option: ServiceOption;

  selected?: boolean;

  onSelect?: (option: ServiceOption) => void;
};

export const ServiceOptionCard = ({
  option,
  selected = false,
  onSelect,
}: ServiceOptionCardProps) => {
  return (
    <Card
      className={
        selected
          ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-600/10"
          : ""
      }
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">{option.label}</h3>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="size-4 text-emerald-700" />

              {formatDuration(option.durationMinutes)}
            </div>
          </div>

          {selected && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Check className="size-4" />
            </div>
          )}
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <div className="text-xs text-slate-400">Giá dịch vụ</div>

            <div className="mt-1 text-xl font-bold text-emerald-700">
              {formatCurrency(option.defaultPrice)}
            </div>
          </div>

          <Button
            type="button"
            variant={selected ? "secondary" : "outline"}
            onClick={() => onSelect?.(option)}
          >
            {selected ? "Đã chọn" : "Chọn"}

            {!selected && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
};
