"use client";

import {
  Bell,
  Menu,
  UserRound,
  X,
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  CircleDollarSign,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AppLogo } from "@/components/ui/AppLogo";
import { cn } from "@/lib/utils";
import { TherapistMobileNav } from "./TherapistMobileNav";
import { TherapistSidebar } from "./TherapistSidebar";

const MOBILE_ITEMS = [
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
    icon: CalendarDays,
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

type TherapistLayoutProps = {
  children: React.ReactNode;
};

export const TherapistLayout = ({ children }: TherapistLayoutProps) => {
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TherapistSidebar />

      <div className="lg:pl-[260px]">
        <header
          className="
            sticky top-0 z-20
            flex h-16 items-center justify-between
            border-b border-slate-200/70
            bg-white/95 px-4 backdrop-blur
            sm:px-6
            lg:h-[72px] lg:px-8
          "
        >
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl hover:bg-slate-100"
            >
              <Menu className="size-5" />
            </button>

            <AppLogo compact />
          </div>

          <div className="hidden lg:block">
            <div className="text-sm font-medium text-slate-400">
              Khu vực kỹ thuật viên
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <Bell className="size-5" />

              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2 rounded-xl px-1 sm:px-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <UserRound className="size-5" />
              </div>

              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">
                  Kỹ thuật viên
                </div>

                <div className="text-xs text-slate-400">Đang hoạt động</div>
              </div>
            </div>
          </div>
        </header>

        <main className="pb-24 lg:pb-0">{children}</main>
      </div>

      <TherapistMobileNav />

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setDrawerOpen(false)}
          />

          <aside className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <AppLogo />

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="space-y-1.5 p-4">
              {MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  (item.href !== "/therapist" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium",
                      active
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};
