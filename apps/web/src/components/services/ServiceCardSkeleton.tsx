import { Card } from "@/components/ui/Card";

export const ServiceCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/10] animate-pulse bg-slate-100" />

      <div className="space-y-4 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-slate-100" />

        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />

          <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />

        <div className="flex items-center justify-between pt-2">
          <div className="h-7 w-28 animate-pulse rounded bg-slate-100" />

          <div className="size-10 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </Card>
  );
};
