import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/lib/auth-storage";

import type { ServerToClientEvents } from "@/types/realtime";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:7200";

type AppSocket = Socket<ServerToClientEvents>;

let socket: AppSocket | null = null;

/**
 * Chỉ tạo instance.
 *
 * KHÔNG connect ở đây.
 */
export const getSocket = (): AppSocket => {
  if (socket) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,

    transports: ["websocket", "polling"],

    reconnection: true,

    reconnectionAttempts: Infinity,

    reconnectionDelay: 1000,

    reconnectionDelayMax: 5000,
  }) as AppSocket;

  /**
   * Mỗi lần Socket.IO reconnect,
   * lấy access token mới nhất.
   */
  socket.io.on("reconnect_attempt", () => {
    if (!socket) {
      return;
    }

    socket.auth = {
      token: getAccessToken(),
    };
  });

  return socket;
};

/**
 * Chỉ update token + connect.
 */
export const connectSocket = (): AppSocket => {
  const current = getSocket();

  const token = getAccessToken();

  current.auth = {
    token,
  };

  if (!current.connected) {
    current.connect();
  }

  return current;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
};
