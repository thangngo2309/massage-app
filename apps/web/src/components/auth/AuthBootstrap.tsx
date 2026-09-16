"use client";

import { useEffect } from "react";

import { AUTH_SESSION_EXPIRED_EVENT } from "@/lib/auth-storage";
import { useAuthStore } from "@/stores/auth-store";

export const AuthBootstrap = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    void initialize();

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired
      );
    };
  }, [initialize, setUser]);

  return null;
};
