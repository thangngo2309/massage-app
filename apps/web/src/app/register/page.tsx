"use client";

import { BriefcaseMedical, UserRound } from "lucide-react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { GuestGuard } from "@/components/auth/GuestGuard";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

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
  const { t: tAuth } = useTranslation("auth");

  const { t: tValidation } = useTranslation("validation");

  const { t: tCommon } = useTranslation("common");

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

      toast.success(tAuth("register.success"));

      const target = getPortalHome(user.role);

      router.replace(target ?? "/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <GuestGuard>
      <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <LanguageSwitcher />
        </div>

        <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-4 py-20 sm:px-6">
          <div className="w-full max-w-xl">
            <div className="mb-7 flex justify-center">
              <AppLogo />
            </div>

            <Card className="p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {tAuth("register.title")}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  {tAuth("register.subtitle")}
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

                  <div className="mt-3 font-bold">
                    {tAuth("register.role.client.title")}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {tAuth("register.role.client.description")}
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

                  <div className="mt-3 font-bold">
                    {tAuth("register.role.therapist.title")}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {tAuth("register.role.therapist.description")}
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
                  label={tAuth("register.fullNameLabel")}
                  placeholder={tAuth("register.fullNamePlaceholder")}
                  error={errors.fullName?.message}
                  {...register("fullName", {
                    required: tValidation("fullName.required"),

                    minLength: {
                      value: 2,

                      message: tValidation("fullName.minLength", {
                        count: 2,
                      }),
                    },
                  })}
                />

                <Input
                  id="phone"
                  label={tAuth("register.phoneLabel")}
                  placeholder={tAuth("register.phonePlaceholder")}
                  error={errors.phone?.message}
                  {...register("phone", {
                    required: tValidation("phone.required"),

                    minLength: {
                      value: 9,

                      message: tValidation("phone.invalid"),
                    },
                  })}
                />

                <Input
                  id="email"
                  label={tAuth("register.emailLabel")}
                  type="email"
                  placeholder={tAuth("register.emailPlaceholder")}
                  error={errors.email?.message}
                  {...register("email", {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                      message: tValidation("email.invalid"),
                    },
                  })}
                />

                <Input
                  id="password"
                  label={tAuth("register.passwordLabel")}
                  type="password"
                  placeholder={tAuth("register.passwordPlaceholder")}
                  error={errors.password?.message}
                  {...register("password", {
                    required: tValidation("password.required"),

                    minLength: {
                      value: 8,

                      message: tValidation("password.minLength", {
                        count: 8,
                      }),
                    },
                  })}
                />

                <Input
                  id="confirmPassword"
                  label={tAuth("register.confirmPasswordLabel")}
                  type="password"
                  placeholder={tAuth("register.confirmPasswordPlaceholder")}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword", {
                    required: tValidation("confirmPassword.required"),

                    validate: (value) =>
                      value === password ||
                      tValidation("confirmPassword.mismatch"),
                  })}
                />

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  loadingText={tCommon("processing")}
                  className="w-full"
                >
                  {tAuth("register.submit")}
                </Button>
              </form>

              <div className="mt-7 text-center text-sm text-slate-500">
                {tAuth("register.alreadyAccount")}{" "}
                <Link href="/login" className="font-bold text-emerald-700">
                  {tAuth("register.loginNow")}
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
