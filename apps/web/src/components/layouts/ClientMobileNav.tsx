"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Search, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  {
    label: "Trang chủ",
    href: "/client",
    icon: Home,
  },
  {
    label: "Tìm kiếm",
    href: "/client/therapists",
    icon: Search,
  },
  {
    label: "Lịch hẹn",
    href: "/client/bookings",
    icon: CalendarDays,
  },
  {
    label: "Hồ sơ",
    href: "/client/profile",
    icon: UserRound,
  },
];

export const ClientMobileNav = () => {
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

              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
