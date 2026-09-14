"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";

import { AppLogo } from "@/components/ui/AppLogo";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    label: "Tổng quan",
    href: "/therapist",
    icon: LayoutDashboard,
  },
  {
    label: "Booking của tôi",
    href: "/therapist/bookings",
    icon: CalendarDays,
  },
  {
    label: "Lịch làm việc",
    href: "/therapist/schedule",
    icon: WalletCards,
  },
  {
    label: "Dịch vụ",
    href: "/therapist/services",
    icon: Sparkles,
  },
  {
    label: "Thu nhập",
    href: "/therapist/income",
    icon: CircleDollarSign,
  },
  {
    label: "Hồ sơ",
    href: "/therapist/profile",
    icon: UserRound,
  },
];

export const TherapistSidebar = () => {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-30
        hidden w-[260px]
        border-r border-slate-200
        bg-white
        lg:flex lg:flex-col
      "
    >
      <div className="flex h-[72px] items-center border-b border-slate-100 px-6">
        <Link href="/therapist">
          <AppLogo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
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
                "flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
          <div className="text-sm font-semibold text-emerald-950">
            Mang sức khỏe đến mọi nhà
          </div>

          <div className="mt-1 text-xs leading-5 text-emerald-700/70">
            Cùng lan tỏa giá trị của massage trị liệu.
          </div>
        </div>
      </div>
    </aside>
  );
};
