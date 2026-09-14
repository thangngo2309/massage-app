"use client";

import { usePathname, useRouter } from "next/navigation";

import { useEffect } from "react";

import { AuthScreenLoader } from "@/components/auth/AuthScreenLoader";

import { getPortalHome } from "@/lib/auth-routing";

import { useAuthStore } from "@/stores/auth-store";

import type { UserRole } from "@/types/auth";

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles: UserRole[];
};

export const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);

  const initialized = useAuthStore((state) => state.initialized);

  const roleAllowed = !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);

      return;
    }

    if (!roleAllowed) {
      const target = getPortalHome(user.role);

      router.replace(target ?? "/login");
    }
  }, [initialized, pathname, roleAllowed, router, user]);

  if (!initialized || !user || !roleAllowed) {
    return <AuthScreenLoader />;
  }

  return <>{children}</>;
};
