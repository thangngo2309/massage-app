import { create } from "zustand";

type BookingTransferConsentState = {
  allowGroupTransfer: boolean;

  pendingBookingId: number | null;

  setAllowGroupTransfer: (allowed: boolean) => void;

  setPendingBookingId: (bookingId: number | null) => void;

  reset: () => void;
};

export const useBookingTransferConsentStore =
  create<BookingTransferConsentState>((set) => ({
    allowGroupTransfer: false,

    pendingBookingId: null,

    setAllowGroupTransfer: (allowed) => {
      set({
        allowGroupTransfer: allowed,
      });
    },

    setPendingBookingId: (bookingId) => {
      set({
        pendingBookingId: bookingId,
      });
    },

    reset: () => {
      set({
        allowGroupTransfer: false,

        pendingBookingId: null,
      });
    },
  }));
