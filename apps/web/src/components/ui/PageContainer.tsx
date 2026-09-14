import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px]",
        "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
};
