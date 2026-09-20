import type { ReactNode } from "react";

type LegalSectionProps = {
  title: string;
  children: ReactNode;
};

export const LegalSection = ({ title, children }: LegalSectionProps) => {
  return (
    <section className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">
        {title}
      </h2>

      <div className="space-y-4 leading-7 text-slate-700">{children}</div>
    </section>
  );
};
