import { AppLogo } from "@/components/ui/AppLogo";

export const AuthScreenLoader = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8faf9]">
      <div className="flex flex-col items-center gap-5">
        <AppLogo />

        <div className="size-8 animate-spin rounded-full border-[3px] border-emerald-100 border-t-emerald-700" />

        <div className="text-sm text-slate-500">Đang tải...</div>
      </div>
    </div>
  );
};
