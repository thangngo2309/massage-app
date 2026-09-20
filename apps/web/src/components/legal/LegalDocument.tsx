import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  updatedAt: string;
  description?: string;
  children: ReactNode;
};

export const LegalDocument = ({
  title,
  updatedAt,
  description,
  children,
}: LegalDocumentProps) => {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Văn bản pháp lý
        </p>

        <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            {description}
          </p>
        ) : null}

        <p className="mt-5 text-sm text-slate-500">
          Cập nhật lần cuối: {updatedAt}
        </p>
      </div>

      <div className="space-y-10 px-5 py-8 sm:px-8 md:px-10 md:py-10">
        {children}
      </div>
    </article>
  );
};
