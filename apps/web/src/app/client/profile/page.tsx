"use client";

import { CalendarDays, LogOut, ShieldCheck } from "lucide-react";

import { useRouter } from "next/navigation";

import { useState } from "react";

import { ClientProfileCard } from "@/components/client-profile/ClientProfileCard";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import { useAuthStore } from "@/stores/auth-store";

export default function ClientProfilePage() {
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      /**
       * Store logout đã tự:
       *
       * - lấy refresh token
       * - gọi logoutApi
       * - clear local storage
       * - set user = null
       */
      await logout();

      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Tài khoản của tôi
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Quản lý tài khoản và các hoạt động của bạn.
        </p>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/*
         * =====================================
         * PROFILE
         * =====================================
         */}

        <ClientProfileCard />

        {/*
         * =====================================
         * SIDEBAR
         * =====================================
         */}

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="font-bold text-slate-950">Hoạt động</h2>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => router.push("/client/bookings")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <CalendarDays className="size-5 text-emerald-700" />
                Lịch đặt của tôi
              </button>

              <button
                type="button"
                onClick={() => router.push("/client/services")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ShieldCheck className="size-5 text-emerald-700" />
                Đặt dịch vụ mới
              </button>
            </div>
          </Card>

          {/*
           * =====================================
           * LOGOUT
           * =====================================
           */}

          <Card className="p-5">
            <Button
              type="button"
              variant="outline"
              className="w-full text-red-600"
              loading={loggingOut}
              disabled={loggingOut}
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Đăng xuất
            </Button>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
