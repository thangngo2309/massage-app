"use client";

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

import { useAuthStore } from "@/stores/auth-store";

type LoginFormValues = {
  login: string;
  password: string;
};

export default function LoginPage() {
  const { t: tAuth } = useTranslation("auth");

  const { t: tValidation } = useTranslation("validation");

  const { t: tCommon } = useTranslation("common");

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

        toast.error(tAuth("login.adminNotAllowed"));

        return;
      }

      toast.success(tAuth("login.success"));

      router.replace(target);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <GuestGuard>
      <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
          <LanguageSwitcher />
        </div>

        <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-2">
          <section className="hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
            <AppLogo />

            <div className="max-w-xl">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                {tAuth("login.marketing.eyebrow")}
              </div>

              <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-slate-950">
                {tAuth("login.marketing.title")}
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
                {tAuth("login.marketing.description")}
              </p>
            </div>

            <div className="text-sm text-slate-400">Massage Home Care</div>
          </section>

          <section className="flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-10 lg:py-10">
            <div className="w-full max-w-md">
              <div className="mb-8 flex justify-center lg:hidden">
                <AppLogo />
              </div>

              <Card className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {tAuth("login.title")}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {tAuth("login.subtitle")}
                </p>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-7 space-y-5"
                >
                  <Input
                    id="login"
                    label={tAuth("login.accountLabel")}
                    placeholder={tAuth("login.accountPlaceholder")}
                    autoComplete="username"
                    error={errors.login?.message}
                    {...register("login", {
                      required: tValidation("login.required"),

                      minLength: {
                        value: 3,

                        message: tValidation("login.minLength", {
                          count: 3,
                        }),
                      },
                    })}
                  />

                  <Input
                    id="password"
                    label={tAuth("login.passwordLabel")}
                    type="password"
                    placeholder={tAuth("login.passwordPlaceholder")}
                    autoComplete="current-password"
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

                  <Button
                    type="submit"
                    size="lg"
                    loading={isSubmitting}
                    loadingText={tCommon("processing")}
                    className="w-full"
                  >
                    {tAuth("login.submit")}
                  </Button>
                </form>

                <div className="mt-7 text-center text-sm text-slate-500">
                  {tAuth("login.noAccount")}{" "}
                  <Link href="/register" className="font-bold text-emerald-700">
                    {tAuth("login.registerNow")}
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
