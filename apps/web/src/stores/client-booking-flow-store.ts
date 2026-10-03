"use client";

import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";

type BookingLocation = {
  address: string;

  latitude: number | null;

  longitude: number | null;

  provinceCode: string;

  provinceName: string;

  wardCode: string;

  wardName: string;
};

type ClientBookingFlowState = BookingLocation & {
  serviceId: number | null;

  therapistId: number | null;

  therapistServiceIds: number[];

  date: string;

  startTime: string;

  setLocation: (value: Partial<BookingLocation>) => void;

  setService: (serviceId: number) => void;

  setTherapist: (therapistId: number) => void;

  setTherapistServices: (therapistServiceIds: number[]) => void;

  setDate: (date: string) => void;

  setStartTime: (startTime: string) => void;

  resetSelection: () => void;

  reset: () => void;
};

const initialState = {
  address: "",

  latitude: null,

  longitude: null,

  provinceCode: "",

  provinceName: "",

  wardCode: "",

  wardName: "",

  serviceId: null,

  therapistId: null,

  therapistServiceIds: [],

  date: "",

  startTime: "",
} satisfies Omit<
  ClientBookingFlowState,
  | "setLocation"
  | "setService"
  | "setTherapist"
  | "setTherapistServices"
  | "setDate"
  | "setStartTime"
  | "resetSelection"
  | "reset"
>;

const sameNumberArray = (left: number[], right: number[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

export const useClientBookingFlowStore = create<ClientBookingFlowState>()(
  persist(
    (set) => ({
      ...initialState,

      setLocation: (value) => {
        set((state) => ({
          ...state,

          ...value,

          /**
           * Location thay đổi có thể làm KTV hiện tại
           * không còn phù hợp.
           *
           * Vì vậy reset phần selection phía sau.
           */
          therapistId: null,

          therapistServiceIds: [],

          date: "",

          startTime: "",
        }));
      },

      setService: (serviceId) => {
        set((state) => {
          if (state.serviceId === serviceId) {
            return state;
          }

          return {
            ...state,

            serviceId,

            therapistId: null,

            therapistServiceIds: [],

            date: "",

            startTime: "",
          };
        });
      },

      setTherapist: (therapistId) => {
        set((state) => {
          if (state.therapistId === therapistId) {
            return state;
          }

          return {
            ...state,

            therapistId,

            therapistServiceIds: [],

            date: "",

            startTime: "",
          };
        });
      },

      setTherapistServices: (therapistServiceIds) => {
        const normalized = Array.from(new Set(therapistServiceIds)).filter(
          (value) => Number.isInteger(value) && value > 0
        );

        set((state) => {
          if (sameNumberArray(state.therapistServiceIds, normalized)) {
            return state;
          }

          return {
            ...state,

            therapistServiceIds: normalized,

            /**
             * Duration booking đã thay đổi nên slot
             * đang chọn không còn đảm bảo hợp lệ.
             */
            startTime: "",
          };
        });
      },

      setDate: (date) => {
        set((state) => {
          if (state.date === date) {
            return state;
          }

          return {
            ...state,

            date,

            startTime: "",
          };
        });
      },

      setStartTime: (startTime) => {
        set({
          startTime,
        });
      },

      /**
       * Giữ location nhưng xoá toàn bộ selection.
       *
       * Có thể dùng sau khi booking thành công.
       */
      resetSelection: () => {
        set((state) => ({
          ...state,

          serviceId: null,

          therapistId: null,

          therapistServiceIds: [],

          date: "",

          startTime: "",
        }));
      },

      reset: () => {
        set({
          ...initialState,
        });
      },
    }),

    {
      name: "massage-client-booking-flow",

      storage: createJSONStorage(() => sessionStorage),

      partialize: (state) => ({
        address: state.address,

        latitude: state.latitude,

        longitude: state.longitude,

        provinceCode: state.provinceCode,

        provinceName: state.provinceName,

        wardCode: state.wardCode,

        wardName: state.wardName,

        serviceId: state.serviceId,

        therapistId: state.therapistId,

        therapistServiceIds: state.therapistServiceIds,

        date: state.date,

        startTime: state.startTime,
      }),
    }
  )
);
