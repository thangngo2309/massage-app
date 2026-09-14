import { AuthGuard } from "@/components/auth/AuthGuard";

import { ClientLayout } from "@/components/layouts/ClientLayout";

import { UserRole } from "@/types/auth";

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[UserRole.CLIENT]}>
      <ClientLayout>{children}</ClientLayout>
    </AuthGuard>
  );
}
