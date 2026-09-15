"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { CalendarDays, Home, Sparkles, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  {
    label: "Tổng quan",
    href: "/therapist",
    icon: Home,
  },

  {
    label: "Booking",
    href: "/therapist/bookings",
    icon: CalendarDays,
  },

  {
    label: "Dịch vụ",
    href: "/therapist/services",
    icon: Sparkles,
  },

  {
    label: "Hồ sơ",
    href: "/therapist/profile",
    icon: UserRound,
  },
];

export const TherapistMobileNav = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/therapist") {
      return pathname === "/therapist";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="
          fixed
          inset-x-0
          bottom-0
          z-40
          border-t
          border-slate-200
          bg-white/95
          shadow-[0_-4px_20px_rgba(15,23,42,0.04)]
          backdrop-blur
          lg:hidden
        "
    >
      <div
        className="
            grid
            grid-cols-4
            pb-[env(safe-area-inset-bottom)]
          "
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;

          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                `
                      relative
                      flex
                      min-h-[64px]
                      flex-col
                      items-center
                      justify-center
                      gap-1
                      px-1
                      text-[11px]
                      font-medium
                      transition-colors
                    `,
                active
                  ? "text-emerald-700"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {/*
               * ACTIVE INDICATOR
               */}

              {active && (
                <span
                  className="
                        absolute
                        left-1/2
                        top-0
                        h-[3px]
                        w-8
                        -translate-x-1/2
                        rounded-b-full
                        bg-emerald-600
                      "
                />
              )}

              <Icon
                className={cn(
                  "size-5 transition-transform",
                  active && "scale-105"
                )}
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
