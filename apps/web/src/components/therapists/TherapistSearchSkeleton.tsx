import { Card } from "@/components/ui/Card";

export const TherapistSearchSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex gap-4">
          <div className="size-20 shrink-0 animate-pulse rounded-2xl bg-slate-100" />

          <div className="flex-1 space-y-3">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />

            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />

            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        <div className="mt-5 h-24 animate-pulse rounded-2xl bg-slate-100" />

        <div className="mt-5 flex items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded bg-slate-100" />

          <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </Card>
  );
};
