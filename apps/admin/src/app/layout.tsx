import type { Metadata } from "next";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import { AppProvider } from "@/providers/AppProvider";

import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: BRAND.adminName,
    template: `%s | ${BRAND.adminName}`,
  },

  description: BRAND.description,

  applicationName: BRAND.adminName,
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="vi">
      <body>
        <AppRouterCacheProvider>
          <AppProvider>{children}</AppProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
