"use client";

import { Mail, Phone, UserRound } from "lucide-react";

import { Card } from "@/components/ui/Card";

import { useAuthStore } from "@/stores/auth-store";

export const ClientProfileCard = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-8 sm:px-7">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
            <UserRound className="size-9" />
          </div>

          <div className="mt-4 min-w-0 sm:ml-5 sm:mt-0">
            <h2 className="truncate text-xl font-bold text-slate-950">
              {user.fullName || "Khách hàng"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">Tài khoản khách hàng</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {!!user.phone && (
          <div className="flex items-center gap-4 px-5 py-4 sm:px-7">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Phone className="size-5" />
            </div>

            <div>
              <div className="text-xs text-slate-400">Số điện thoại</div>

              <div className="mt-1 font-semibold text-slate-900">
                {user.phone}
              </div>
            </div>
          </div>
        )}

        {!!user.email && (
          <div className="flex items-center gap-4 px-5 py-4 sm:px-7">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Mail className="size-5" />
            </div>

            <div className="min-w-0">
              <div className="text-xs text-slate-400">Email</div>

              <div className="mt-1 truncate font-semibold text-slate-900">
                {user.email}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
