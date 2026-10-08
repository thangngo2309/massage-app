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
  /**
   * User đang sở hữu booking flow hiện tại.
   *
   * Dùng để tránh trường hợp:
   *
   * User A nhập địa chỉ / chọn dịch vụ
   * -> logout
   * -> User B login
   * -> User B nhận lại booking flow của User A.
   */
  ownerUserId: number | null;

  serviceId: number | null;

  therapistId: number | null;

  therapistServiceIds: number[];

  date: string;

  startTime: string;

  /**
   * Gắn booking flow hiện tại với user.
   *
   * Nếu user thay đổi thì reset toàn bộ flow.
   */
  bindUser: (userId: number) => void;

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
  ownerUserId: null,

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
  | "bindUser"
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

      /**
       * =============================================
       * BIND USER
       * =============================================
       *
       * Nếu booking flow đang thuộc user khác
       * hoặc là dữ liệu persisted cũ chưa có owner,
       * reset toàn bộ flow.
       */
      bindUser: (userId) => {
        set((state) => {
          if (state.ownerUserId === userId) {
            return state;
          }

          return {
            ...initialState,

            ownerUserId: userId,
          };
        });
      },

      /**
       * =============================================
       * LOCATION
       * =============================================
       */
      setLocation: (value) => {
        set((state) => ({
          ...state,

          ...value,

          /**
           * Location thay đổi có thể làm KTV hiện tại
           * không còn phù hợp.
           *
           * Vì vậy reset toàn bộ selection phía sau.
           *
           * Service vẫn được giữ lại vì người dùng
           * vẫn có thể tiếp tục với cùng service
           * sau khi đổi location.
           */
          therapistId: null,

          therapistServiceIds: [],

          date: "",

          startTime: "",
        }));
      },

      /**
       * =============================================
       * SERVICE
       * =============================================
       */
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

      /**
       * =============================================
       * THERAPIST
       * =============================================
       */
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

      /**
       * =============================================
       * THERAPIST SERVICES
       * =============================================
       */
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

      /**
       * =============================================
       * DATE
       * =============================================
       */
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

      /**
       * =============================================
       * START TIME
       * =============================================
       */
      setStartTime: (startTime) => {
        set({
          startTime,
        });
      },

      /**
       * =============================================
       * RESET SELECTION
       * =============================================
       *
       * Giữ:
       *
       * - ownerUserId
       * - location
       *
       * Xoá selection booking.
       *
       * Dùng sau khi booking thành công.
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

      /**
       * =============================================
       * RESET ALL
       * =============================================
       *
       * Dùng khi:
       *
       * - logout
       * - session expired
       * - không còn session
       *
       * Reset cả ownerUserId.
       */
      reset: () => {
        set({
          ...initialState,
        });
      },
    }),

    {
      name: "massage-client-booking-flow",

      storage: createJSONStorage(() => sessionStorage),

      /**
       * Chỉ persist data.
       *
       * Không persist các action.
       */
      partialize: (state) => ({
        ownerUserId: state.ownerUserId,

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