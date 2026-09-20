"use client";

import { CalendarDays, Home, Search, UserRound } from "lucide-react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const ITEMS = [
  {
    labelKey: "client.home",
    href: "/client",
    icon: Home,
  },
  {
    labelKey: "client.search",
    href: "/client/therapists",
    icon: Search,
  },
  {
    labelKey: "client.bookings",
    href: "/client/bookings",
    icon: CalendarDays,
  },
  {
    labelKey: "client.profile",
    href: "/client/profile",
    icon: UserRound,
  },
];

export const ClientMobileNav = () => {
  const pathname = usePathname();

  const { t } = useTranslation("navigation");

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
            px-2
            pb-[env(safe-area-inset-bottom)]
          "
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/client" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium",

                active ? "text-emerald-700" : "text-slate-400"
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.4]")} />

              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
