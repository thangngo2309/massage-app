import { Check } from "lucide-react";

import { cn, formatDateTime } from "@/lib/utils";

import { BookingStatus, type BookingStatusHistory } from "@/types/booking";

type BookingTimelineProps = {
  histories: BookingStatusHistory[];
};

const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  [BookingStatus.PENDING]: "Booking được tạo",

  [BookingStatus.WAITING_THERAPIST_ACCEPT]: "Đang chờ kỹ thuật viên xác nhận",

  [BookingStatus.CONFIRMED]: "Kỹ thuật viên đã xác nhận",

  [BookingStatus.THERAPIST_ON_THE_WAY]: "Kỹ thuật viên đang di chuyển",

  [BookingStatus.ARRIVED]: "Kỹ thuật viên đã đến",

  [BookingStatus.IN_PROGRESS]: "Bắt đầu dịch vụ",

  [BookingStatus.COMPLETED]: "Hoàn thành dịch vụ",

  [BookingStatus.REJECTED]: "Kỹ thuật viên từ chối",

  [BookingStatus.CANCELLED_BY_CLIENT]: "Khách hàng hủy",

  [BookingStatus.CANCELLED_BY_THERAPIST]: "Kỹ thuật viên hủy",

  [BookingStatus.CANCELLED_BY_ADMIN]: "Hệ thống hủy",

  [BookingStatus.EXPIRED]: "Booking hết hạn",
};

export const BookingTimeline = ({ histories }: BookingTimelineProps) => {
  const sorted = [...histories].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (!sorted.length) {
    return (
      <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
        Chưa có lịch sử trạng thái.
      </div>
    );
  }

  return (
    <div>
      {sorted.map((history, index) => {
        const last = index === sorted.length - 1;

        return (
          <div key={history.id} className="relative flex gap-4">
            {!last && (
              <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-slate-200" />
            )}

            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="size-4" />
            </div>

            <div
              className={cn(
                "min-w-0 flex-1",

                !last && "pb-7"
              )}
            >
              <div className="font-semibold text-slate-900">
                {STATUS_LABELS[history.toStatus] || history.toStatus}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {formatDateTime(history.createdAt)}
              </div>

              {history.note && (
                <p className="mt-2 text-sm text-slate-500">{history.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
