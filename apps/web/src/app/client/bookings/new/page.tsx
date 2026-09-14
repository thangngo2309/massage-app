import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

export default function NewBookingPage() {
  return (
    <PageContainer className="py-8">
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-slate-950">Xác nhận đặt lịch</h1>

        <p className="mt-2 text-sm text-slate-500">
          Form tạo booking sẽ được hoàn thiện ở Giai đoạn 5.
        </p>
      </Card>
    </PageContainer>
  );
}
