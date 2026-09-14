import { ClientHeader } from "./ClientHeader";
import { ClientMobileNav } from "./ClientMobileNav";

type ClientLayoutProps = {
  children: React.ReactNode;
};

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <ClientHeader />

      <main
        className="
          min-h-[calc(100vh-4rem)]
          pb-24
          lg:min-h-[calc(100vh-72px)]
          lg:pb-0
        "
      >
        {children}
      </main>

      <ClientMobileNav />
    </div>
  );
};
