"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useEffect } from "react";

import { toast } from "sonner";

import { getAccessToken } from "@/lib/auth-storage";

import { getSocket } from "@/lib/socket";

import { useAuthStore } from "@/stores/auth-store";

import type { BookingRealtimePayload } from "@/types/realtime";

type Props = {
  children: React.ReactNode;
};

export const RealtimeProvider = ({ children }: Props) => {
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);

  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const socket = getSocket();

    /**
     * =====================================
     * LOGOUT / NO USER
     * =====================================
     */

    if (!user) {
      socket.disconnect();

      return;
    }

    /**
     * =====================================
     * REFRESH BOOKING DATA
     * =====================================
     *
     * Không dùng dữ liệu socket để patch
     * booking trực tiếp.
     *
     * Socket chỉ báo rằng booking đã thay đổi.
     *
     * Sau đó lấy lại dữ liệu chuẩn từ API.
     */

    const refreshBookingQueries = async (payload?: BookingRealtimePayload) => {
      console.log("[Realtime] refresh booking queries", payload);

      /**
       * Debug toàn bộ query đang tồn tại.
       */
      console.log(
        "[Realtime] current query keys",
        queryClient
          .getQueryCache()
          .getAll()
          .map((query) => query.queryKey)
      );

      /**
       * =====================================
       * REFRESH TẤT CẢ QUERY LIÊN QUAN BOOKING
       * =====================================
       *
       * Không phụ thuộc query key cụ thể như:
       *
       * ["client-booking", 4]
       * ["booking-detail", 4]
       * ["my-booking", 4]
       *
       * Miễn query key có chữ booking.
       */

      await queryClient.refetchQueries({
        predicate: (query) => {
          return query.queryKey.some(
            (item) =>
              typeof item === "string" && item.toLowerCase().includes("booking")
          );
        },

        type: "active",
      });

      /**
       * =====================================
       * AVAILABILITY / SEARCH
       * =====================================
       *
       * Booking thay đổi có thể ảnh hưởng
       * availability nên invalidate cache.
       */

      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: ["therapist-availability"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["therapist-search"],
        }),
      ]);
    };

    /**
     * =====================================
     * SOCKET CONNECT
     * =====================================
     */

    const handleConnect = () => {
      console.log("[Realtime] CONNECTED", {
        socketId: socket.id,

        role: user.role,
      });

      /**
       * Rất quan trọng:
       *
       * Nếu server vừa restart hoặc socket
       * mất mạng một thời gian thì có thể
       * đã bỏ lỡ event.
       *
       * Khi reconnect thành công, refetch
       * các booking đang mở.
       */

      void refreshBookingQueries();
    };

    /**
     * =====================================
     * CONNECT ERROR
     * =====================================
     */

    const handleConnectError = (error: Error) => {
      console.warn("[Realtime] CONNECT ERROR", error.message);
    };

    /**
     * =====================================
     * DISCONNECT
     * =====================================
     */

    const handleDisconnect = (reason: string) => {
      console.warn("[Realtime] DISCONNECTED", reason);
    };

    /**
     * =====================================
     * BOOKING CREATED
     * =====================================
     */

    const handleBookingCreated = (payload: BookingRealtimePayload) => {
      console.log("[Realtime] booking.created", payload);

      /**
       * Refetch data trước.
       */

      void refreshBookingQueries(payload);

      /**
       * Therapist nhận booking mới.
       */

      if (user.role === "therapist") {
        toast.success("Bạn có booking mới.", {
          description: `Booking #${payload.id} đang chờ xác nhận.`,
        });
      }
    };

    /**
     * =====================================
     * BOOKING UPDATED
     * =====================================
     */

    const handleBookingUpdated = (payload: BookingRealtimePayload) => {
      console.log("[Realtime] booking.updated RECEIVED", payload);

      /**
       * Đây mới là phần quan trọng.
       *
       * Status, timeline, timestamps,
       * cancellation reason...
       *
       * đều được lấy lại từ Backend.
       */

      void refreshBookingQueries(payload);

      /**
       * Không hiện toast cho chính role
       * vừa thực hiện action.
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
     * =====================================
     * REGISTER LISTENERS
     * =====================================
     */

    socket.on("connect", handleConnect);

    socket.on("connect_error", handleConnectError);

    socket.on("disconnect", handleDisconnect);

    socket.on("booking.created", handleBookingCreated);

    socket.on("booking.updated", handleBookingUpdated);

    /**
     * =====================================
     * CONNECT
     * =====================================
     */

    const token = getAccessToken();

    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      /**
       * Provider mount lại nhưng socket
       * vẫn đang connected.
       *
       * Sync lại dữ liệu ngay.
       */

      void refreshBookingQueries();
    }

    /**
     * =====================================
     * CLEANUP LISTENERS
     * =====================================
     */

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
