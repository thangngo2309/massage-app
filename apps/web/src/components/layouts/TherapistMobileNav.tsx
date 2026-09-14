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

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-40
        border-t border-slate-200
        bg-white/95 backdrop-blur
        lg:hidden
      "
    >
      <div
        className="
          grid grid-cols-4
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/therapist" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-emerald-700" : "text-slate-400"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
