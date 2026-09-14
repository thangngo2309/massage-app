import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const ServicesEmptyState = () => {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <SearchX className="size-7" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">Chưa có dịch vụ</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Hiện chưa có dịch vụ nào đang được mở để đặt lịch. Vui lòng quay lại
        sau.
      </p>
    </Card>
  );
};
