"use client";

import { Bell, LogOut, Menu, UserRound, X } from "lucide-react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { AppLogo } from "@/components/ui/AppLogo";

import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";

const NAV_ITEMS = [
  {
    labelKey: "client.services",
    href: "/client/services",
  },
  {
    labelKey: "client.therapists",
    href: "/client/therapists",
  },
  {
    labelKey: "client.bookings",
    href: "/client/bookings",
  },
  {
    labelKey: "client.account",
    href: "/client/profile",
  },
];

export const ClientHeader = () => {
  const { t } = useTranslation(["common", "navigation"]);

  const pathname = usePathname();

  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await logout();

      setMobileOpen(false);

      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link href="/client" aria-label={t("navigation:client.home")}>
            <AppLogo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);

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
                  {t(`navigation:${item.labelKey}`)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <LanguageSwitcher className="mr-1" />

            <button
              type="button"
              disabled
              aria-label={t("common:notification.label")}
              title={t("common:notification.comingSoon")}
              className="flex size-10 items-center justify-center rounded-xl text-slate-300"
            >
              <Bell className="size-5" />
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
                  {t("common:account.customer")}
                </div>

                <div className="text-xs text-slate-400">
                  {t("common:account.yourAccount")}
                </div>
              </div>
            </Link>

            <button
              type="button"
              aria-label={t("common:menu.open")}
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
            aria-label={t("common:menu.close")}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
              <AppLogo />

              <button
                type="button"
                aria-label={t("common:menu.close")}
                onClick={() => setMobileOpen(false)}
                className="flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-4 text-sm font-medium transition-colors",

                      active
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {t(`navigation:${item.labelKey}`)}
                  </Link>
                );
              })}
            </nav>

            <div className="shrink-0 border-t border-slate-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
    </>
  );
};
