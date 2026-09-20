import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

type LegalLayoutProps = {
  children: ReactNode;
};

const LegalLayout = ({ children }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            {legalConfig.appName}
          </Link>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              href="/quy-che-hoat-dong"
              className="text-slate-600 transition hover:text-slate-950"
            >
              Quy chế hoạt động
            </Link>

            <Link
              href="/chinh-sach-bao-mat"
              className="text-slate-600 transition hover:text-slate-950"
            >
              Chính sách bảo mật
            </Link>

            <Link
              href="/chinh-sach-khieu-nai"
              className="text-slate-600 transition hover:text-slate-950"
            >
              Quản lý khiếu nại
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {children}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
          <div className="space-y-1">
            <p className="font-medium text-slate-700">
              {legalConfig.companyName}
            </p>

            <p>{legalConfig.address}</p>

            <p>
              Hotline:{" "}
              <a
                href={`tel:${legalConfig.hotline}`}
                className="hover:text-slate-900"
              >
                {legalConfig.hotline}
              </a>
            </p>

            <p>
              Email:{" "}
              <a
                href={`mailto:${legalConfig.email}`}
                className="hover:text-slate-900"
              >
                {legalConfig.email}
              </a>
            </p>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            © {new Date().getFullYear()} {legalConfig.companyName}. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;
