"use client";

import Link from "next/link";

import { BriefcaseMedical, UserRound } from "lucide-react";

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
import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";

import { UserRole } from "@/types/auth";

type RegisterFormValues = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;

  role: UserRole.CLIENT | UserRole.THERAPIST;
};

export default function RegisterPage() {
  const router = useRouter();

  const registerAccount = useAuthStore((state) => state.register);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.CLIENT,
    },
  });

  const role = watch("role");

  const password = watch("password");

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const user = await registerAccount({
        fullName: values.fullName.trim(),

        phone: values.phone.trim(),

        email: values.email.trim() || undefined,

        password: values.password,

        role: values.role,

        deviceName: "web",
      });

      toast.success("Đăng ký thành công.");

      const target = getPortalHome(user.role);

      router.replace(target ?? "/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-xl">
            <div className="mb-7 flex justify-center">
              <AppLogo />
            </div>

            <Card className="p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Tạo tài khoản
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Chọn loại tài khoản phù hợp để bắt đầu.
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setValue("role", UserRole.CLIENT, {
                      shouldValidate: true,
                    })
                  }
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",

                    role === UserRole.CLIENT
                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <UserRound className="size-6 text-emerald-700" />

                  <div className="mt-3 font-bold">Khách hàng</div>

                  <div className="mt-1 text-xs text-slate-500">
                    Tìm và đặt lịch massage.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setValue("role", UserRole.THERAPIST, {
                      shouldValidate: true,
                    })
                  }
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",

                    role === UserRole.THERAPIST
                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <BriefcaseMedical className="size-6 text-emerald-700" />

                  <div className="mt-3 font-bold">Kỹ thuật viên</div>

                  <div className="mt-1 text-xs text-slate-500">
                    Nhận và quản lý booking.
                  </div>
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-7 space-y-5"
              >
                <input type="hidden" {...register("role")} />

                <Input
                  id="fullName"
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  error={errors.fullName?.message}
                  {...register("fullName", {
                    required: "Vui lòng nhập họ và tên.",

                    minLength: {
                      value: 2,
                      message: "Họ tên phải có ít nhất 2 ký tự.",
                    },
                  })}
                />

                <Input
                  id="phone"
                  label="Số điện thoại"
                  placeholder="0901234567"
                  error={errors.phone?.message}
                  {...register("phone", {
                    required: "Vui lòng nhập số điện thoại.",

                    minLength: {
                      value: 9,
                      message: "Số điện thoại không hợp lệ.",
                    },
                  })}
                />

                <Input
                  id="email"
                  label="Email (không bắt buộc)"
                  type="email"
                  placeholder="example@gmail.com"
                  error={errors.email?.message}
                  {...register("email", {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email không hợp lệ.",
                    },
                  })}
                />

                <Input
                  id="password"
                  label="Mật khẩu"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  error={errors.password?.message}
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu.",

                    minLength: {
                      value: 8,
                      message: "Mật khẩu phải có ít nhất 8 ký tự.",
                    },
                  })}
                />

                <Input
                  id="confirmPassword"
                  label="Xác nhận mật khẩu"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu.",

                    validate: (value) =>
                      value === password || "Mật khẩu xác nhận không khớp.",
                  })}
                />

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  Đăng ký
                </Button>
              </form>

              <div className="mt-7 text-center text-sm text-slate-500">
                Đã có tài khoản?{" "}
                <Link href="/login" className="font-bold text-emerald-700">
                  Đăng nhập
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
