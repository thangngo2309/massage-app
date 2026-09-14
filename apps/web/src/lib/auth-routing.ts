import { UserRole } from "@/types/auth";

export const getPortalHome = (role: UserRole) => {
  switch (role) {
    case UserRole.CLIENT:
      return "/client";

    case UserRole.THERAPIST:
      return "/therapist";

    default:
      return null;
  }
};
