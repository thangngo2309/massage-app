"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/stores/auth-store";

export const AuthBootstrap = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return null;
};
