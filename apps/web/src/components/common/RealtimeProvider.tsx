"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

import { useAuthStore } from "@/stores/auth-store";

import type { BookingRealtimePayload } from "@/types/realtime";

type Props = {
  children: React.ReactNode;
};

const BOOKING_DATA_QUERY_KEYS = new Set([
  "my-bookings",
  "my-booking",
  "therapist-bookings",
  "therapist-booking",
  "therapist-dashboard-bookings",
]);

const isBookingDataQuery = (queryKey: readonly unknown[]) => {
  const firstKey = queryKey[0];

  return (
    typeof firstKey === "string" &&
    BOOKING_DATA_QUERY_KEYS.has(firstKey)
  );
};

export const RealtimeProvider = ({ children }: Props) => {
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    /**
     * User logout thì đóng socket.
     *
     * Không gọi getSocket() trước đoạn này để tránh
     * tạo socket instance không cần thiết ở trang login.
     */
    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();

    /**
     * =========================================
     * SYNC BOOKING DATA
     * =========================================
     *
     * Socket không phải source of truth.
     *
     * Socket chỉ thông báo rằng dữ liệu đã thay đổi.
     * Sau đó API được gọi lại để lấy dữ liệu thật từ DB.
     */
    const refreshBookingQueries = async () => {
      await Promise.allSettled([
        /**
         * Refetch:
         *
         * client-bookings
         * client-booking
         * therapist-bookings
         * therapist-booking
         * therapist-dashboard-bookings
         *
         * Nhưng không refetch booking-rating.
         */
        queryClient.invalidateQueries({
          predicate: (query) => isBookingDataQuery(query.queryKey),
          refetchType: "active",
        }),

        /**
         * Booking mới/cancel/completed có thể
         * ảnh hưởng availability.
         */
        queryClient.invalidateQueries({
          queryKey: ["therapist-availability"],
          refetchType: "active",
        }),

        /**
         * Search therapist cũng phụ thuộc availability.
         */
        queryClient.invalidateQueries({
          queryKey: ["therapist-search"],
          refetchType: "active",
        }),
      ]);
    };

    /**
     * =========================================
     * CONNECT
     * =========================================
     */
    const handleConnect = () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[Realtime] CONNECTED", {
          socketId: socket.id,
          role: user.role,
        });
      }

      /**
       * Có thể đã bỏ lỡ event trong lúc socket mất kết nối.
       * Vì vậy reconnect xong luôn sync API.
       */
      void refreshBookingQueries();
    };

    const handleConnectError = (error: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Realtime] CONNECT ERROR", error.message);
      }
    };

    const handleDisconnect = (reason: string) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Realtime] DISCONNECTED", reason);
      }
    };

    /**
     * =========================================
     * BOOKING CREATED
     * =========================================
     */
    const handleBookingCreated = (payload: BookingRealtimePayload) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[Realtime] booking.created", payload);
      }

      void refreshBookingQueries();

      if (user.role === "therapist") {
        toast.success("Bạn có booking mới.", {
          description: `Booking #${payload.id} đang chờ xác nhận.`,
        });
      }
    };

    /**
     * =========================================
     * BOOKING UPDATED
     * =========================================
     */
    const handleBookingUpdated = (payload: BookingRealtimePayload) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[Realtime] booking.updated", payload);
      }

      /**
       * Refetch cả bên thực hiện action.
       *
       * Ví dụ therapist PATCH status xong thì:
       * - detail refresh
       * - list refresh
       * - dashboard refresh
       *
       * Client cũng refresh tương tự.
       */
      void refreshBookingQueries();

      /**
       * Không toast cho chính role vừa thực hiện action.
       * Nhưng data vẫn được refetch ở trên.
       */
      if (payload.sourceRole === user.role) {
        return;
      }

      if (user.role === "client") {
        toast.info("Lịch hẹn đã được cập nhật.", {
          description: `Booking #${payload.id}`,
        });
        return;
      }

      if (user.role === "therapist") {
        toast.info("Booking đã thay đổi.", {
          description: `Booking #${payload.id}`,
        });
      }
    };

    /**
     * =========================================
     * LISTENERS
     * =========================================
     *
     * Register listener trước rồi mới connect.
     */
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("booking.created", handleBookingCreated);
    socket.on("booking.updated", handleBookingUpdated);

    /**
     * connectSocket() tự lấy access token mới nhất.
     */
    if (!socket.connected) {
      connectSocket();
    } else {
      /**
       * Provider mount lại trong lúc socket vẫn connected.
       * Sync data một lần.
       */
      void refreshBookingQueries();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("booking.created", handleBookingCreated);
      socket.off("booking.updated", handleBookingUpdated);
    };
  }, [initialized, user, queryClient]);

  return children;
};
