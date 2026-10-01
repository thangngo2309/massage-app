"use client";

import {
  ArrowLeft,
  BriefcaseMedical,
  KeyRound,
  RefreshCw,
  UserRound,
} from "lucide-react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { Controller, useForm } from "react-hook-form";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { GuestGuard } from "@/components/auth/GuestGuard";

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

import { AppLogo } from "@/components/ui/AppLogo";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { Input } from "@/components/ui/Input";

import { sendRegistrationOtpApi, verifyRegistrationOtpApi } from "@/lib/auth";

import { getApiErrorMessage } from "@/lib/http";

import { cn } from "@/lib/utils";

import { useAuthStore } from "@/stores/auth-store";

import { UserRole } from "@/types/auth";

import { Gender } from "@/types/therapist-self";

type RegisterFormValues = {
  fullName: string;

  phone: string;

  email: string;

  referralCode: string;

  password: string;

  confirmPassword: string;

  role: UserRole.CLIENT | UserRole.THERAPIST;

  gender: Gender;

  dateOfBirth: string;

  address: string;

  stageName: string;

  hasTattoo: boolean;

  experienceYears: number | "";
};

type OtpFormValues = {
  code: string;
};

type RegisterStep = "register" | "otp";

export default function RegisterPage() {
  const { t: tAuth } = useTranslation("auth");

  const { t: tValidation } = useTranslation("validation");

  const { t: tCommon } = useTranslation("common");

  const router = useRouter();

  const registerAccount = useAuthStore((state) => state.register);

  /**

   * ================================================================

   * REGISTER STEP

   * ================================================================

   */

  const [step, setStep] = useState<RegisterStep>("register");

  /**

   * Số điện thoại Backend trả về sau register.

   *

   * Ví dụ:

   *

   * 0905123456

   * ->

   * +84905123456

   */

  const [registeredPhone, setRegisteredPhone] = useState("");

  /**

   * Countdown gửi lại OTP.

   */

  const [resendSeconds, setResendSeconds] = useState(0);

  const [isResending, setIsResending] = useState(false);

  /**

   * ================================================================

   * REGISTER FORM

   * ================================================================

   */

  const {
    register,

    handleSubmit,

    watch,

    setValue,

    control,

    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",

      phone: "",

      email: "",

      password: "",

      confirmPassword: "",

      role: UserRole.CLIENT,

      gender: "unknown",

      dateOfBirth: "",

      address: "",

      stageName: "",

      hasTattoo: false,

      experienceYears: "",
    },
  });

  /**

   * ================================================================

   * OTP FORM

   * ================================================================

   */

  const {
    register: registerOtp,

    handleSubmit: handleSubmitOtp,

    reset: resetOtp,

    setFocus: setOtpFocus,

    formState: {
      errors: otpErrors,

      isSubmitting: isVerifying,
    },
  } = useForm<OtpFormValues>({
    defaultValues: {
      code: "",
    },
  });

  const role = watch("role");

  const password = watch("password");

  /**

   * ================================================================

   * OTP COUNTDOWN

   * ================================================================

   */

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendSeconds]);

  /**

   * Focus vào ô OTP khi

   * chuyển sang bước xác thực.

   */

  useEffect(() => {
    if (step !== "otp") {
      return;
    }

    const timer = window.setTimeout(() => {
      setOtpFocus("code");
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [step, setOtpFocus]);

  /**

   * ================================================================

   * REGISTER

   * ================================================================

   */

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const payload = {
        fullName: values.fullName.trim(),

        phone: values.phone.trim(),

        email: values.email.trim() || undefined,

        referralCode: values.referralCode.trim() || undefined,

        password: values.password,

        role: values.role,

        deviceName: "web",

        ...(values.role === UserRole.THERAPIST
          ? {
              gender: values.gender,

              dateOfBirth: values.dateOfBirth || undefined,

              address: values.address.trim() || undefined,

              stageName: values.stageName.trim() || undefined,

              hasTattoo: values.hasTattoo,

              experienceYears:
                values.experienceYears === ""
                  ? 0
                  : Number(values.experienceYears),
            }
          : {}),
      };

      const response = await registerAccount(payload);

      /**

       * Account lúc này:

       *

       * status = inactive

       *

       * Chưa login.

       * Chưa có token.

       */

      setRegisteredPhone(response.user.phone);

      resetOtp();

      /**

       * Cooldown hiện tại

       * của Backend là 60 giây.

       */

      setResendSeconds(60);

      /**

       * Chuyển UI sang bước OTP.

       */

      setStep("otp");

      toast.success(response.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  /**

   * ================================================================

   * VERIFY OTP

   * ================================================================

   */

  const onVerifyOtp = async (values: OtpFormValues) => {
    if (!registeredPhone) {
      toast.error("Không xác định được số điện thoại");

      return;
    }

    try {
      const response = await verifyRegistrationOtpApi({
        phone: registeredPhone,

        code: values.code.trim(),
      });

      toast.success(response.message);

      /**

       * Backend chỉ chuyển:

       *

       * inactive -> active

       *

       * Không tạo session.

       *

       * User login bình thường

       * để nhận accessToken +

       * refreshToken.

       */

      router.replace("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  /**

   * ================================================================

   * RESEND OTP

   * ================================================================

   */

  const handleResendOtp = async () => {
    if (!registeredPhone || resendSeconds > 0 || isResending) {
      return;
    }

    try {
      setIsResending(true);

      const response = await sendRegistrationOtpApi({
        phone: registeredPhone,
      });

      resetOtp();

      setResendSeconds(response.resendAfter ?? 60);

      toast.success(response.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  /**

   * ================================================================

   * BACK TO REGISTER

   * ================================================================

   */

  const handleBackToRegister = () => {
    resetOtp();

    setStep("register");
  };

  return (
    <GuestGuard>
      <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Language */}

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <LanguageSwitcher />
        </div>

        <div className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-4 py-20 sm:px-6">
          <div className="w-full max-w-xl">
            {/* Logo */}

            <div className="mb-7 flex justify-center">
              <AppLogo />
            </div>

            <Card className="p-6 sm:p-8">
              {/* ================================================== */}

              {/* REGISTER STEP                                      */}

              {/* ================================================== */}

              {step === "register" ? (
                <>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      {tAuth("register.title")}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                      {tAuth("register.subtitle")}
                    </p>
                  </div>

                  {/* ============================================== */}

                  {/* ROLE                                           */}

                  {/* ============================================== */}

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    {/* CLIENT */}

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

                    {/* THERAPIST */}

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

                  {/* ============================================== */}

                  {/* REGISTER FORM                                  */}

                  {/* ============================================== */}

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-7 space-y-5"
                  >
                    <input type="hidden" {...register("role")} />

                    {/* Full name */}

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

                    {/* Phone */}

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

                    {/* Email */}

                    <Input
                      id="email"
                      label={tAuth("register.emailLabel")}
                      type="email"
                      placeholder={tAuth("register.emailPlaceholder")}
                      error={errors.email?.message}
                      {...register("email", {
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\\.[^\s@]+$/,

                          message: tValidation("email.invalid"),
                        },
                      })}
                    />

                    {/* Referral code */}

                    <Input
                      id="referralCode"
                      label="Mã giới thiệu (không bắt buộc)"
                      placeholder="Nhập mã giới thiệu"
                      maxLength={32}
                      {...register("referralCode", {
                        maxLength: 32,
                      })}
                    />

                    {role === UserRole.THERAPIST && (
                      <div className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
                        <div>
                          <div className="font-bold text-slate-900">
                            {tAuth("register.therapistProfile.title")}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {tAuth("register.therapistProfile.description")}
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="gender"
                            className="block text-sm font-semibold text-slate-700"
                          >
                            {tAuth("register.therapistProfile.gender.label")}
                          </label>

                          <select
                            id="gender"
                            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                            {...register("gender")}
                          >
                            <option value="unknown">
                              {tAuth(
                                "register.therapistProfile.gender.unknown"
                              )}
                            </option>

                            <option value="male">
                              {tAuth("register.therapistProfile.gender.male")}
                            </option>

                            <option value="female">
                              {tAuth("register.therapistProfile.gender.female")}
                            </option>

                            <option value="other">
                              {tAuth("register.therapistProfile.gender.other")}
                            </option>
                          </select>
                        </div>

                        <Input
                          id="dateOfBirth"
                          type="date"
                          label={tAuth("register.therapistProfile.dateOfBirth")}
                          {...register("dateOfBirth")}
                        />

                        <Input
                          id="stageName"
                          label={tAuth(
                            "register.therapistProfile.stageName.label"
                          )}
                          placeholder={tAuth(
                            "register.therapistProfile.stageName.placeholder"
                          )}
                          {...register("stageName", {
                            maxLength: 255,
                          })}
                        />

                        <Input
                          id="address"
                          label={tAuth(
                            "register.therapistProfile.address.label"
                          )}
                          placeholder={tAuth(
                            "register.therapistProfile.address.placeholder"
                          )}
                          {...register("address", {
                            maxLength: 2000,
                          })}
                        />

                        <Input
                          id="experienceYears"
                          type="number"
                          min={0}
                          max={100}
                          label={tAuth(
                            "register.therapistProfile.experienceYears"
                          )}
                          {...register("experienceYears", {
                            min: 0,

                            max: 100,
                          })}
                        />

                        <Controller
                          name="hasTattoo"
                          control={control}
                          render={({ field }) => (
                            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                              <span className="text-sm font-semibold text-slate-700">
                                {tAuth("register.therapistProfile.hasTattoo")}
                              </span>

                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(event) =>
                                  field.onChange(event.target.checked)
                                }
                                className="size-5 accent-emerald-700"
                              />
                            </label>
                          )}
                        />
                      </div>
                    )}

                    {/* Password */}

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

                    {/* Confirm password */}

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

                    {/* Submit */}

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

                  {/* Login link */}

                  <div className="mt-7 text-center text-sm text-slate-500">
                    {tAuth("register.alreadyAccount")}{" "}
                    <Link href="/login" className="font-bold text-emerald-700">
                      {tAuth("register.loginNow")}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* ================================================== */}

                  {/* OTP STEP                                           */}

                  {/* ================================================== */}

                  <div className="text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50">
                      <KeyRound className="size-8 text-emerald-700" />
                    </div>

                    <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      Xác thực số điện thoại
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Mã OTP gồm 6 chữ số đã được gửi đến số điện thoại
                    </p>

                    <p className="mt-1 font-bold text-slate-950">
                      {registeredPhone}
                    </p>
                  </div>

                  {/* ============================================== */}

                  {/* OTP FORM                                       */}

                  {/* ============================================== */}

                  <form
                    onSubmit={handleSubmitOtp(onVerifyOtp)}
                    className="mt-8 space-y-5"
                  >
                    <Input
                      id="otpCode"
                      label="Mã OTP"
                      placeholder="Nhập mã OTP 6 số"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      error={otpErrors.code?.message}
                      {...registerOtp("code", {
                        required: "Vui lòng nhập mã OTP",

                        pattern: {
                          value: /^\d{6}$/,

                          message: "Mã OTP phải gồm đúng 6 chữ số",
                        },
                      })}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      loading={isVerifying}
                      loadingText="Đang xác thực..."
                      className="w-full"
                    >
                      Xác thực OTP
                    </Button>
                  </form>

                  {/* ============================================== */}

                  {/* RESEND OTP                                     */}

                  {/* ============================================== */}

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                      Bạn chưa nhận được mã?
                    </p>

                    <button
                      type="button"
                      disabled={resendSeconds > 0 || isResending}
                      onClick={handleResendOtp}
                      className={cn(
                        "mt-2 inline-flex items-center gap-2 text-sm font-bold transition",

                        resendSeconds > 0 || isResending
                          ? "cursor-not-allowed text-slate-400"
                          : "text-emerald-700 hover:text-emerald-800"
                      )}
                    >
                      <RefreshCw
                        className={cn(
                          "size-4",

                          isResending && "animate-spin"
                        )}
                      />

                      {isResending
                        ? "Đang gửi..."
                        : resendSeconds > 0
                        ? `Gửi lại sau ${resendSeconds}s`
                        : "Gửi lại mã OTP"}
                    </button>
                  </div>

                  {/* ============================================== */}

                  {/* BACK                                           */}

                  {/* ============================================== */}

                  <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                    <button
                      type="button"
                      onClick={handleBackToRegister}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                    >
                      <ArrowLeft className="size-4" />
                      Quay lại đăng ký
                    </button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
