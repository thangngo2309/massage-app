"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return children;
}
