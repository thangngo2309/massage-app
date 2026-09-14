"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AuthScreenLoader } from "@/components/auth/AuthScreenLoader";

import { getPortalHome } from "@/lib/auth-routing";

import { useAuthStore } from "@/stores/auth-store";

type GuestGuardProps = {
  children: React.ReactNode;
};

export const GuestGuard = ({ children }: GuestGuardProps) => {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);

  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized || !user) {
      return;
    }

    const target = getPortalHome(user.role);

    if (target) {
      router.replace(target);
    }
  }, [initialized, router, user]);

  if (!initialized) {
    return <AuthScreenLoader />;
  }

  if (user && getPortalHome(user.role)) {
    return <AuthScreenLoader />;
  }

  return <>{children}</>;
};
