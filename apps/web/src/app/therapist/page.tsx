import { CalendarCheck, CheckCircle2, Clock3, Star } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatCard } from "@/components/ui/StatCard";

const BOOKINGS = [
  {
    time: "09:00 - 10:30",
    client: "Nguyễn Hoàng Yến",
    service: "Massage body thư giãn",
    area: "Quận 1",
    price: "350.000đ",
    waiting: true,
  },
  {
    time: "11:00 - 12:00",
    client: "Lê Minh Tú",
    service: "Massage cổ vai gáy",
    area: "Quận 3",
    price: "400.000đ",
    waiting: true,
  },
  {
    time: "14:00 - 15:30",
    client: "Phạm Thu Hà",
    service: "Massage body",
    area: "Quận 7",
    price: "350.000đ",
    waiting: false,
  },
];

export default function TherapistPage() {
  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <section>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Chào buổi sáng!
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Chúc bạn một ngày làm việc hiệu quả và nhiều năng lượng.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CalendarCheck}
            label="Lịch hôm nay"
            value="5"
            helper="buổi"
          />

          <StatCard
            icon={Clock3}
            label="Đang chờ xác nhận"
            value="2"
            helper="buổi"
          />

          <StatCard
            icon={CheckCircle2}
            label="Hoàn thành"
            value="12"
            helper="tuần này"
          />

          <StatCard
            icon={Star}
            label="Đánh giá"
            value="4.9"
            helper="86 lượt đánh giá"
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Booking sắp tới
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Các booking cần xử lý hôm nay.
              </p>
            </div>

            <Badge variant="success">Hôm nay</Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {BOOKINGS.map((booking) => (
              <div
                key={`${booking.time}-${booking.client}`}
                className="
                      flex flex-col gap-4 p-5
                      md:flex-row
                      md:items-center
                    "
              >
                <div className="md:w-[120px]">
                  <div className="font-semibold text-slate-900">
                    {booking.time}
                  </div>

                  <div className="mt-1 text-xs text-emerald-600">Hôm nay</div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">
                    {booking.client}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {booking.service}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {booking.area}
                  </div>
                </div>

                <div className="font-bold text-slate-900 md:text-right">
                  {booking.price}
                </div>

                <div className="flex gap-2 md:w-[190px] md:justify-end">
                  {booking.waiting ? (
                    <>
                      <Button size="sm" className="flex-1 md:flex-none">
                        Xác nhận
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 md:flex-none"
                      >
                        Từ chối
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline">
                      Xem chi tiết
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-sm font-medium text-slate-500">
              Trạng thái làm việc
            </div>

            <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500" />

                <span className="font-bold text-emerald-800">
                  Đang nhận lịch
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-emerald-700/70">
                Hồ sơ của bạn đang hiển thị với khách hàng.
              </p>
            </div>

            <Button variant="outline" className="mt-4 w-full">
              Tạm ngừng nhận lịch
            </Button>
          </Card>

          <Card className="p-5">
            <div className="text-sm text-slate-500">Thu nhập tuần này</div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              4.850.000đ
            </div>

            <div className="mt-2 text-sm font-medium text-emerald-600">
              ↑ 12% so với tuần trước
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
