import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";

const SERVICES = [
  {
    name: "Massage thư giãn",
    description: "Giảm căng thẳng và tái tạo năng lượng.",
  },
  {
    name: "Massage cổ vai gáy",
    description: "Hỗ trợ giảm đau mỏi vùng cổ và vai.",
  },
  {
    name: "Massage body",
    description: "Thư giãn toàn thân và cân bằng cơ thể.",
  },
  {
    name: "Foot massage",
    description: "Thư giãn đôi chân sau ngày dài.",
  },
];

const THERAPISTS = [
  {
    name: "Trần Thị Thanh",
    rating: 4.9,
    reviews: 128,
    area: "Quận 1",
    price: "350.000đ",
  },
  {
    name: "Lê Minh Tú",
    rating: 4.8,
    reviews: 96,
    area: "Quận 3",
    price: "400.000đ",
  },
  {
    name: "Nguyễn Thị Hà",
    rating: 4.9,
    reviews: 112,
    area: "Quận 7",
    price: "400.000đ",
  },
];

export default function ClientPage() {
  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="relative z-10 max-w-2xl">
              <Badge className="bg-white/10 text-emerald-50">
                Chăm sóc tại nhà
              </Badge>

              <h1 className="mt-5 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Đặt lịch massage tại nhà
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                Tìm kỹ thuật viên phù hợp với nhu cầu, khu vực và thời gian của
                bạn.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/client/services">
                  <Button
                    size="lg"
                    className="w-full bg-white text-emerald-800 hover:bg-emerald-50 sm:w-auto"
                  >
                    <Sparkles className="size-5" />
                    Khám phá dịch vụ
                  </Button>
                </Link>

                <Link href="/client/therapists">
                  <Button
                    size="lg"
                    className="w-full border border-white/20 bg-white/10 hover:bg-white/20 sm:w-auto"
                  >
                    <Search className="size-5" />
                    Tìm kỹ thuật viên
                  </Button>
                </Link>
              </div>
            </div>

            <div className="absolute -bottom-32 -right-24 size-[420px] rounded-full bg-white/10 blur-3xl" />
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                  Dịch vụ nổi bật
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Chọn liệu trình phù hợp với nhu cầu của bạn.
                </p>
              </div>

              <Link
                href="/client/services"
                className="hidden items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:flex"
              >
                Xem tất cả
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {SERVICES.map((service) => (
                <Card
                  key={service.name}
                  className="group overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Sparkles className="size-5" />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    {service.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {service.description}
                  </p>

                  <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-emerald-700">
                    Xem chi tiết
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                Kỹ thuật viên nổi bật
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Đội ngũ được xác minh và đánh giá bởi khách hàng.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {THERAPISTS.map((therapist) => (
                <Card key={therapist.name} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-xl font-bold text-emerald-700">
                      {therapist.name[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-900">
                        {therapist.name}
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-sm">
                        <Star className="size-4 fill-amber-400 text-amber-400" />

                        <span className="font-semibold">
                          {therapist.rating}
                        </span>

                        <span className="text-slate-400">
                          ({therapist.reviews} đánh giá)
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="size-4" />

                        {therapist.area}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <div className="text-xs text-slate-400">Từ</div>

                      <div className="font-bold text-emerald-700">
                        {therapist.price}
                      </div>
                    </div>

                    <Button size="sm">Đặt lịch</Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Lịch hẹn sắp tới</h2>

              <CalendarDays className="size-5 text-emerald-700" />
            </div>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
              <Badge variant="success">Đã xác nhận</Badge>

              <div className="mt-3 font-bold text-slate-900">
                Massage body thư giãn
              </div>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>14:00 - 15:30</div>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  123 Nguyễn Văn Cừ, Quận 1
                </div>
              </div>
            </div>

            <Button variant="outline" className="mt-4 w-full">
              Xem chi tiết
            </Button>
          </Card>

          <Card className="p-5">
            <ShieldCheck className="size-8 text-emerald-700" />

            <h3 className="mt-4 font-bold text-slate-900">
              An tâm khi đặt lịch
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kỹ thuật viên được kiểm duyệt thông tin và lịch sử hoạt động.
            </p>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
