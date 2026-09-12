import type { Metadata } from "next";
import { AppProvider } from "@/providers/AppProvider";

export const metadata: Metadata = {
  title: {
    default: "Massage Admin",
    template: "%s | Massage Admin",
  },
  description: "Massage Platform Administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
