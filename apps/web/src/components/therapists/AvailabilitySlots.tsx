import { Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TherapistAvailabilitySlot } from "@/types/therapist-search";

type AvailabilitySlotsProps = {
  slots: TherapistAvailabilitySlot[];

  selectedTime?: string;

  onSelect: (slot: TherapistAvailabilitySlot) => void;
};

export const AvailabilitySlots = ({
  slots,
  selectedTime,
  onSelect,
}: AvailabilitySlotsProps) => {
  const availableSlots = slots.filter((slot) => slot.available);

  if (availableSlots.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
        <Clock3 className="mx-auto size-8 text-slate-300" />

        <div className="mt-3 font-semibold text-slate-800">
          Không còn khung giờ
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Kỹ thuật viên không còn lịch khả dụng trong ngày này.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot) => {
        const selected = selectedTime === slot.startTime;

        return (
          <button
            key={`${slot.startTime}-${slot.endTime}`}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelect(slot)}
            className={cn(
              "rounded-xl border px-3 py-3 text-left transition",

              slot.available &&
                !selected &&
                "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50",

              selected &&
                "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10",

              !slot.available &&
                "cursor-not-allowed border-slate-100 bg-slate-50 opacity-40"
            )}
          >
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Clock3 className="size-4 text-emerald-700" />

              {slot.startTime}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              đến {slot.endTime}
            </div>
          </button>
        );
      })}
    </div>
  );
};
