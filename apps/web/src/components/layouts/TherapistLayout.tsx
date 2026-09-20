"use client";

import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

import { AppLogo } from "@/components/ui/AppLogo";

import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";

import { TherapistMobileNav } from "./TherapistMobileNav";
import { TherapistSidebar } from "./TherapistSidebar";

const MOBILE_ITEMS = [
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
    icon: CalendarDays,
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

type TherapistLayoutProps = {
  children: React.ReactNode;
};

export const TherapistLayout = ({ children }: TherapistLayoutProps) => {
  const { t } = useTranslation(["common", "navigation"]);

  const pathname = usePathname();

  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/therapist") {
      return pathname === "/therapist";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await logout();

      setDrawerOpen(false);

      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TherapistSidebar />

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-[72px] lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-label={t("common:menu.open")}
              onClick={() => setDrawerOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Menu className="size-5" />
            </button>

            <AppLogo compact />
          </div>

          <div className="hidden lg:block">
            <div className="text-sm font-medium text-slate-400">
              {t("common:therapist.area")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              type="button"
              disabled
              aria-label={t("common:notification.label")}
              title={t("common:notification.comingSoon")}
              className="flex size-10 items-center justify-center rounded-xl text-slate-300"
            >
              <Bell className="size-5" />
            </button>

            <div className="flex items-center gap-2 rounded-xl px-1 sm:px-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <UserRound className="size-5" />
              </div>

              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">
                  {t("common:account.therapist")}
                </div>

                <div className="text-xs text-slate-400">
                  {t("common:account.active")}
                </div>
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
            aria-label={t("common:menu.close")}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />

          <aside className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
              <AppLogo />

              <button
                type="button"
                aria-label={t("common:menu.close")}
                onClick={() => setDrawerOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
              {MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;

                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors",

                      active
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="size-5 shrink-0" />

                    <span>{t(`navigation:${item.labelKey}`)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="shrink-0 border-t border-slate-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="mb-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
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
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>
      )}
    </div>
  );
};
