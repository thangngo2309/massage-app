import type { Metadata } from "next";

import "./globals.css";

import { AppProviders } from "@/components/common/AppProviders";

export const metadata: Metadata = {
  title: {
    default: "Massage Home Care",

    template: "%s | Massage Home Care",
  },

  description: "Nền tảng đặt lịch massage tại nhà",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
