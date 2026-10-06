"use client";

import { ArrowRightLeft, ShieldCheck, UsersRound } from "lucide-react";

import { useTranslation } from "react-i18next";

import { useBookingTransferConsentStore } from "@/stores/booking-transfer-consent-store";

export const BookingTransferConsentCard = () => {
  const { t } = useTranslation("booking");

  const allowed = useBookingTransferConsentStore(
    (state) => state.allowGroupTransfer
  );

  const setAllowed = useBookingTransferConsentStore(
    (state) => state.setAllowGroupTransfer
  );

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <UsersRound className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-950">
              {t("transfer.consent.title", {
                defaultValue: "Cho phép chuyển KTV trong cùng nhóm",
              })}
            </h3>

            <ShieldCheck className="size-4 shrink-0 text-emerald-700" />
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {t("transfer.consent.description", {
              defaultValue:
                "Nếu kỹ thuật viên bạn chọn không thể nhận lịch, kỹ thuật viên đó có thể đề nghị chuyển booking cho một kỹ thuật viên khác trong cùng nhóm. Bạn vẫn được xem và xác nhận kỹ thuật viên mới trước khi booking được chuyển.",
            })}
          </p>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-white p-3.5 transition hover:border-emerald-300">
            <input
              type="checkbox"
              checked={allowed}
              onChange={(event) => setAllowed(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-emerald-600"
            />

            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">
                {t("transfer.consent.checkbox", {
                  defaultValue:
                    "Tôi đồng ý cho phép chuyển KTV trong cùng nhóm",
                })}
              </span>

              <span className="mt-1 flex items-center gap-1.5 text-xs leading-5 text-slate-500">
                <ArrowRightLeft className="size-3.5 shrink-0" />

                {t("transfer.consent.notice", {
                  defaultValue:
                    "Hệ thống không tự chuyển. KTV hiện tại phải chủ động đề nghị và bạn sẽ xác nhận KTV thay thế.",
                })}
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
