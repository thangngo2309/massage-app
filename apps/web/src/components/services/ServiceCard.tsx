import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDuration } from "@/lib/utils";
import type { ServiceListItem } from "@/types/service";

type ServiceCardProps = {
  service: ServiceListItem;
};

const getMinimumPrice = (service: ServiceListItem) => {
  const activeOptions =
    service.options?.filter((option) => option.isActive) ?? [];

  if (!activeOptions.length) {
    return null;
  }

  return Math.min(
    ...activeOptions.map((option) => Number(option.defaultPrice))
  );
};

const getMinimumDuration = (service: ServiceListItem) => {
  const activeOptions =
    service.options?.filter((option) => option.isActive) ?? [];

  if (!activeOptions.length) {
    return null;
  }

  return Math.min(
    ...activeOptions.map((option) => Number(option.durationMinutes))
  );
};

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const minPrice = getMinimumPrice(service);

  const minDuration = getMinimumDuration(service);

  return (
    <Link
      href={`/client/services/${service.id}`}
      className="group block h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-sm">
                <Sparkles className="size-9" />
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg font-bold text-slate-950">{service.name}</h3>

          <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">
            {service.description ||
              "Trải nghiệm dịch vụ massage chuyên nghiệp và thư giãn tại nhà."}
          </p>

          {minDuration !== null && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="size-4 text-emerald-700" />
              Từ {formatDuration(minDuration)}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div>
              <div className="text-xs text-slate-400">Giá từ</div>

              <div className="mt-0.5 text-lg font-bold text-emerald-700">
                {minPrice !== null ? formatCurrency(minPrice) : "Liên hệ"}
              </div>
            </div>

            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
