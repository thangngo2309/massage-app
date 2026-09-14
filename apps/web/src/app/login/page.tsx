"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { GuestGuard } from "@/components/auth/GuestGuard";
import { AppLogo } from "@/components/ui/AppLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

import { getPortalHome } from "@/lib/auth-routing";
import { getApiErrorMessage } from "@/lib/http";

import { useAuthStore } from "@/stores/auth-store";

type LoginFormValues = {
  login: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();

  const login = useAuthStore((state) => state.login);

  const logout = useAuthStore((state) => state.logout);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const user = await login({
        login: values.login.trim(),
        password: values.password,
        deviceName: "web",
      });

      const target = getPortalHome(user.role);

      if (!target) {
        await logout();

        toast.error("Tài khoản quản trị không sử dụng Web Portal.");

        return;
      }

      toast.success("Đăng nhập thành công.");

      router.replace(target);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-2">
          <section className="hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
            <AppLogo />

            <div className="max-w-xl">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Massage Home Care
              </div>

              <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-slate-950">
                Thư giãn bắt đầu từ một lịch hẹn.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
                Kết nối khách hàng với kỹ thuật viên massage phù hợp, nhanh
                chóng và tiện lợi ngay tại nhà.
              </p>
            </div>

            <div className="text-sm text-slate-400">Massage Home Care</div>
          </section>

          <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
            <div className="w-full max-w-md">
              <div className="mb-8 flex justify-center lg:hidden">
                <AppLogo />
              </div>

              <Card className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Đăng nhập
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Đăng nhập để quản lý lịch hẹn và tài khoản.
                </p>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-7 space-y-5"
                >
                  <Input
                    id="login"
                    label="Số điện thoại hoặc email"
                    placeholder="Số điện thoại hoặc email"
                    autoComplete="username"
                    error={errors.login?.message}
                    {...register("login", {
                      required: "Vui lòng nhập tài khoản.",

                      minLength: {
                        value: 3,
                        message: "Tài khoản phải có ít nhất 3 ký tự.",
                      },
                    })}
                  />

                  <Input
                    id="password"
                    label="Mật khẩu"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register("password", {
                      required: "Vui lòng nhập mật khẩu.",

                      minLength: {
                        value: 8,
                        message: "Mật khẩu phải có ít nhất 8 ký tự.",
                      },
                    })}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    loading={isSubmitting}
                    className="w-full"
                  >
                    Đăng nhập
                  </Button>
                </form>

                <div className="mt-7 text-center text-sm text-slate-500">
                  Chưa có tài khoản?{" "}
                  <Link href="/register" className="font-bold text-emerald-700">
                    Đăng ký ngay
                  </Link>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </GuestGuard>
  );
}
