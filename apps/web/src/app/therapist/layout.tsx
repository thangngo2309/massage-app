import { AuthGuard } from "@/components/auth/AuthGuard";

import { TherapistLayout } from "@/components/layouts/TherapistLayout";

import { UserRole } from "@/types/auth";

export default function TherapistRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.THERAPIST]}>
      <TherapistLayout>{children}</TherapistLayout>
    </AuthGuard>
  );
}
