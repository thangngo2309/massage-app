"use client";

import {
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { AppLogo } from "@/components/ui/AppLogo";

import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";

const ITEMS = [
  {
    labelKey: "therapist.overview",
    href: "/therapist",
    icon: LayoutDashboard,
  },
  {
    labelKey: "therapist.bookings",
    href: "/therapist/bookings",
    icon: CalendarDays,
  },
  {
    labelKey: "therapist.schedule",
    href: "/therapist/schedule",
    icon: CalendarClock,
  },
  {
    labelKey: "therapist.services",
    href: "/therapist/services",
    icon: Sparkles,
  },
  {
    labelKey: "therapist.income",
    href: "/therapist/income",
    icon: CircleDollarSign,
  },
  {
    labelKey: "therapist.profile",
    href: "/therapist/profile",
    icon: UserRound,
  },
];

export const TherapistSidebar = () => {
  const { t } = useTranslation(["common", "navigation"]);

  const pathname = usePathname();

  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/therapist") {
      return pathname === "/therapist";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await logout();

      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

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
      <div className="flex h-[72px] shrink-0 items-center border-b border-slate-100 px-6">
        <Link href="/therapist" className="inline-flex">
          <AppLogo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;

          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                `
                      flex min-h-12
                      items-center
                      gap-3
                      rounded-xl
                      px-4
                      text-sm
                      font-medium
                      transition-colors
                    `,

                active
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="size-5 shrink-0" />

              <span>{t(`navigation:${item.labelKey}`)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
          <div className="text-sm font-semibold text-emerald-950">
            {t("common:therapist.sloganTitle")}
          </div>

          <div className="mt-1 text-xs leading-5 text-emerald-700/70">
            {t("common:therapist.sloganDescription")}
          </div>
        </div>

        <button
          type="button"
          disabled={loggingOut}
          onClick={handleLogout}
          className="
              mt-3
              flex min-h-12
              w-full
              items-center
              gap-3
              rounded-xl
              px-4
              text-left
              text-sm
              font-medium
              text-red-600
              transition-colors
              hover:bg-red-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
        >
          <LogOut className="size-5 shrink-0" />

          <span>
            {loggingOut
              ? t("common:logout.processing")
              : t("common:logout.action")}
          </span>
        </button>
      </div>
    </aside>
  );
};
