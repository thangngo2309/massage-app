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
  LogOut,
} from "lucide-react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { useState } from "react";

import { AppLogo } from "@/components/ui/AppLogo";

import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";

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

  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  /**
   * =========================================
   * CHECK ACTIVE MENU
   * =========================================
   */

  const isActive = (href: string) => {
    if (href === "/therapist") {
      return pathname === "/therapist";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /**
   * =========================================
   * LOGOUT
   * =========================================
   */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      /**
       * auth-store.logout()
       * đã tự:
       *
       * - lấy refresh token
       * - gọi /auth/logout
       * - clear access token
       * - clear refresh token
       * - clear stored user
       * - set user = null
       */
      await logout();

      /**
       * Đóng drawer trước khi
       * chuyển về login.
       */
      setDrawerOpen(false);

      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      {/*
       * =====================================
       * DESKTOP SIDEBAR
       * =====================================
       */}

      <TherapistSidebar />

      {/*
       * =====================================
       * CONTENT
       * =====================================
       */}

      <div className="lg:pl-[260px]">
        {/*
         * =====================================
         * HEADER
         * =====================================
         */}

        <header
          className="
            sticky
            top-0
            z-20
            flex
            h-16
            items-center
            justify-between
            border-b
            border-slate-200/70
            bg-white/95
            px-4
            backdrop-blur
            sm:px-6
            lg:h-[72px]
            lg:px-8
          "
        >
          {/*
           * MOBILE LEFT
           */}

          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setDrawerOpen(true)}
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-xl
                text-slate-600
                transition-colors
                hover:bg-slate-100
              "
            >
              <Menu className="size-5" />
            </button>

            <AppLogo compact />
          </div>

          {/*
           * DESKTOP TITLE
           */}

          <div className="hidden lg:block">
            <div className="text-sm font-medium text-slate-400">
              Khu vực kỹ thuật viên
            </div>
          </div>

          {/*
           * HEADER RIGHT
           */}

          <div className="flex items-center gap-2">
            {/*
             * NOTIFICATION
             */}

            <button
              type="button"
              className="
                relative
                flex
                size-10
                items-center
                justify-center
                rounded-xl
                text-slate-500
                transition-colors
                hover:bg-slate-100
              "
            >
              <Bell className="size-5" />

              <span
                className="
                  absolute
                  right-2
                  top-2
                  size-2
                  rounded-full
                  bg-red-500
                  ring-2
                  ring-white
                "
              />
            </button>

            {/*
             * CURRENT USER
             */}

            <div className="flex items-center gap-2 rounded-xl px-1 sm:px-2">
              <div
                className="
                  flex
                  size-9
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-100
                  text-emerald-700
                "
              >
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

        {/*
         * =====================================
         * PAGE CONTENT
         * =====================================
         */}

        <main className="pb-24 lg:pb-0">{children}</main>
      </div>

      {/*
       * =====================================
       * MOBILE BOTTOM NAV
       * =====================================
       */}

      <TherapistMobileNav />

      {/*
       * =====================================
       * MOBILE DRAWER
       * =====================================
       */}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/*
           * OVERLAY
           */}

          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />

          {/*
           * DRAWER
           */}

          <aside
            className="
              absolute
              left-0
              top-0
              flex
              h-full
              w-[86%]
              max-w-sm
              flex-col
              bg-white
              shadow-2xl
            "
          >
            {/*
             * DRAWER HEADER
             */}

            <div
              className="
                flex
                h-16
                shrink-0
                items-center
                justify-between
                border-b
                border-slate-100
                px-5
              "
            >
              <AppLogo />

              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setDrawerOpen(false)}
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-500
                  transition-colors
                  hover:bg-slate-100
                "
              >
                <X className="size-5" />
              </button>
            </div>

            {/*
             * =====================================
             * MOBILE MENU
             * =====================================
             *
             * flex-1 rất quan trọng:
             *
             * menu chiếm toàn bộ khoảng trống,
             * logout sẽ luôn nằm ở cuối drawer.
             */}

            <nav
              className="
                flex-1
                space-y-1.5
                overflow-y-auto
                p-4
              "
            >
              {MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;

                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      `
                          flex
                          min-h-12
                          items-center
                          gap-3
                          rounded-xl
                          px-4
                          text-sm
                          font-medium
                          transition-colors
                        `,
                      active
                        ? `
                            bg-emerald-50
                            text-emerald-800
                          `
                        : `
                            text-slate-600
                            hover:bg-slate-50
                            hover:text-slate-900
                          `
                    )}
                  >
                    <Icon className="size-5 shrink-0" />

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/*
             * =====================================
             * MOBILE DRAWER FOOTER
             * =====================================
             */}

            <div
              className="
                shrink-0
                border-t
                border-slate-100
                p-4
                pb-[calc(1rem+env(safe-area-inset-bottom))]
              "
            >
              {/*
               * SLOGAN
               */}

              <div
                className="
                  mb-3
                  rounded-2xl
                  bg-gradient-to-br
                  from-emerald-50
                  to-teal-50
                  p-4
                "
              >
                <div className="text-sm font-semibold text-emerald-950">
                  Mang sức khỏe đến mọi nhà
                </div>

                <div className="mt-1 text-xs leading-5 text-emerald-700/70">
                  Cùng lan tỏa giá trị của massage trị liệu.
                </div>
              </div>

              {/*
               * LOGOUT
               */}

              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="
                  flex
                  min-h-12
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  text-left
                  text-sm
                  font-semibold
                  text-red-600
                  transition-colors
                  hover:bg-red-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <LogOut className="size-5 shrink-0" />

                <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
