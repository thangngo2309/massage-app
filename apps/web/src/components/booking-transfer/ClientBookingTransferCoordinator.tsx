"use client";

import { usePathname } from "next/navigation";

import { BookingTransferConsentCard } from "@/components/booking-transfer/BookingTransferConsentCard";

import { ClientBookingTransferPanel } from "@/components/booking-transfer/ClientBookingTransferPanel";

import { PageContainer } from "@/components/ui/PageContainer";

export const ClientBookingTransferCoordinator = () => {
  const pathname = usePathname();

  if (pathname === "/client/bookings/new") {
    return (
      <PageContainer className="pt-5">
        <BookingTransferConsentCard />
      </PageContainer>
    );
  }

  const detailMatch = pathname.match(/^\/client\/bookings\/(\d+)$/);

  if (!detailMatch) {
    return null;
  }

  const bookingId = Number(detailMatch[1]);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return null;
  }

  return (
    <PageContainer className="pt-5">
      <ClientBookingTransferPanel bookingId={bookingId} />
    </PageContainer>
  );
};
