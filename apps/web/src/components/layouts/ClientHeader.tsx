"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Menu, Search, UserRound, X } from "lucide-react";
import { useState } from "react";

import { AppLogo } from "@/components/ui/AppLogo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dịch vụ",
    href: "/client/services",
  },
  {
    label: "Kỹ thuật viên",
    href: "/client/therapists",
  },
  {
    label: "Lịch hẹn",
    href: "/client/bookings",
  },
  {
    label: "Hồ sơ",
    href: "/client/profile",
  },
];

export const ClientHeader = () => {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link href="/client">
            <AppLogo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 sm:flex"
            >
              <Search className="size-5" />
            </button>

            <button
              type="button"
              className="relative flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <Bell className="size-5" />

              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <Link
              href="/client/profile"
              className="ml-1 hidden items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 sm:flex"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <UserRound className="size-5" />
              </div>

              <div className="hidden text-left xl:block">
                <div className="text-sm font-semibold text-slate-900">
                  Khách hàng
                </div>

                <div className="text-xs text-slate-400">Tài khoản của bạn</div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="ml-1 flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <AppLogo />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-4 text-sm font-medium",
                      active
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-4 border-t border-slate-100" />

              <Link
                href="/client/bookings"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm text-slate-600 hover:bg-slate-50"
              >
                <CalendarDays className="size-5" />
                Lịch hẹn của tôi
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
