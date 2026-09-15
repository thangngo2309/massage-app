"use client";

import { Plus, Trash2 } from "lucide-react";

import type { TherapistWorkingHour } from "@/types/therapist-self";

const DAY_LABELS = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

type Props = {
  value: TherapistWorkingHour[];

  onChange: (value: TherapistWorkingHour[]) => void;
};

export const WorkingHoursEditor = ({ value, onChange }: Props) => {
  const addShift = (dayOfWeek: number) => {
    onChange([
      ...value,

      {
        dayOfWeek,

        startTime: "08:00",

        endTime: "17:00",

        isActive: true,
      },
    ]);
  };

  const updateShift = (index: number, patch: Partial<TherapistWorkingHour>) => {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
  };

  const removeShift = (index: number) => {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-5">
      {DAY_LABELS.map((label, dayOfWeek) => {
        const shifts = value
          .map((item, index) => ({
            item,
            index,
          }))
          .filter(({ item }) => item.dayOfWeek === dayOfWeek);

        return (
          <div
            key={dayOfWeek}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="font-semibold text-slate-900">{label}</div>

              <button
                type="button"
                onClick={() => addShift(dayOfWeek)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"
              >
                <Plus className="size-4" />
                Thêm ca
              </button>
            </div>

            {!shifts.length ? (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-400">
                Nghỉ
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {shifts.map(({ item, index }) => (
                  <div
                    key={`${dayOfWeek}-${index}`}
                    className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(event) =>
                        updateShift(index, {
                          startTime: event.target.value,
                        })
                      }
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    />

                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(event) =>
                        updateShift(index, {
                          endTime: event.target.value,
                        })
                      }
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() => removeShift(index)}
                      className="flex size-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
