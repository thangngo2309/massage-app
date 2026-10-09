import Image from "next/image";

import { cn } from "@/lib/utils";

import { BRAND } from "@/lib/brand";

type AppLogoProps = {
  compact?: boolean;
  className?: string;
};

export const AppLogo = ({ compact = false, className }: AppLogoProps) => {
  return (
    <div
      className={cn("flex shrink-0 items-center", className)}
      title={BRAND.name}
    >
      <Image
        src="/images/logo.jpg"
        alt={BRAND.name}
        width={compact ? 44 : 58}
        height={compact ? 44 : 58}
        priority
        className={cn(
          "shrink-0 object-contain",
          compact ? "size-11" : "size-[58px]"
        )}
      />

      {!compact && (
        <div className="ml-2.5 flex flex-col justify-center leading-tight">
          <span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-emerald-950 sm:text-[17px]">
            In Home Massage
          </span>

          <span className="mt-0.5 text-[12px] font-bold tracking-[0.18em] text-amber-600">
            24/7
          </span>
        </div>
      )}
    </div>
  );
};
