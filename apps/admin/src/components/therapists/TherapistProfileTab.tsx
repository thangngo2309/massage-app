"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";

import { Controller, useForm } from "react-hook-form";

import { useEffect, useState } from "react";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  Gender,
  TherapistDetail,
  updateTherapistProfile,
  updateTherapistVerification,
  VerificationStatus,
} from "@/lib/therapists";

interface Props {
  detail: TherapistDetail;

  onChanged: () => void;
}

interface FormValues {
  bio: string;

  gender: Gender;

  dateOfBirth: string;

  experienceYears: string;

  serviceRadiusKm: string;

  isAcceptingBookings: boolean;

  verificationStatus: VerificationStatus;

  address: string;

  stageName: string;

  hasTattoo: boolean;
}

export function TherapistProfileTab({ detail, onChanged }: Props) {
  const [error, setError] = useState("");

  const methods = useForm<FormValues>({
    defaultValues: {
      bio: "",

      gender: "unknown",

      dateOfBirth: "",

      experienceYears: "0",

      serviceRadiusKm: "10",

      isAcceptingBookings: false,

      verificationStatus: "pending",

      address: "",

      stageName: "",

      hasTattoo: false,
    },
  });

  const {
    control,

    handleSubmit,

    reset,

    setValue,

    watch,

    formState: { isSubmitting },
  } = methods;

  /**
   * Theo dõi verification hiện tại
   * để disable switch khi KTV chưa VERIFIED.
   */
  const verificationStatus = watch("verificationStatus");

  /**
   * Khi detail được load lại từ API,
   * đồng bộ toàn bộ dữ liệu DB vào form.
   *
   * Quan trọng:
   * Không có effect khác ghi đè
   * isAcceptingBookings sau reset.
   */
  useEffect(() => {
    reset({
      bio: detail.bio ?? "",

      gender: detail.gender,

      dateOfBirth: detail.dateOfBirth ?? "",

      experienceYears: String(detail.experienceYears),

      serviceRadiusKm: String(detail.serviceRadiusKm),

      /**
       * Nếu KTV đã verified thì dùng đúng
       * trạng thái đang lưu trong DB.
       *
       * Nếu chưa verified thì normalize false.
       */
      isAcceptingBookings:
        detail.verificationStatus === "verified"
          ? Boolean(detail.isAcceptingBookings)
          : false,

      verificationStatus: detail.verificationStatus,

      address: detail.address ?? "",

      stageName: detail.stageName ?? "",

      hasTattoo: detail.hasTattoo ?? false,
    });
  }, [detail, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      setError("");

      const verificationChanged =
        values.verificationStatus !== detail.verificationStatus;

      /**
       * pending/rejected -> verified
       *
       * Cần update verification trước
       * để Backend cho phép bật nhận booking.
       */
      if (verificationChanged && values.verificationStatus === "verified") {
        await updateTherapistVerification(
          detail.userId,
          values.verificationStatus
        );
      }

      /**
       * Update profile.
       */
      await updateTherapistProfile(detail.userId, {
        bio: values.bio.trim() || null,

        gender: values.gender,

        dateOfBirth: values.dateOfBirth || null,

        address: values.address.trim() || null,

        stageName: values.stageName.trim() || null,

        hasTattoo: values.hasTattoo,

        experienceYears: Number(values.experienceYears),

        serviceRadiusKm: Number(values.serviceRadiusKm),

        isAcceptingBookings: values.isAcceptingBookings,
      });

      /**
       * verified -> pending/rejected
       *
       * isAcceptingBookings đã được set false
       * ngay lúc người dùng đổi verification.
       *
       * Sau khi profile được lưu thì mới đổi
       * trạng thái verification.
       */
      if (verificationChanged && values.verificationStatus !== "verified") {
        await updateTherapistVerification(
          detail.userId,
          values.verificationStatus
        );
      }

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể cập nhật hồ sơ"
      );
    }
  };

  return (
    <RHFFormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Box
        sx={{
          display: "flex",

          flexDirection: "column",

          gap: 2,
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",

              md: "repeat(2, minmax(0, 1fr))",
            },

            gap: 2,
          }}
        >
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Giới tính</InputLabel>

                <Select {...field} label="Giới tính">
                  <MenuItem value="unknown">Chưa xác định</MenuItem>

                  <MenuItem value="male">Nam</MenuItem>

                  <MenuItem value="female">Nữ</MenuItem>

                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="verificationStatus"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Xác minh</InputLabel>

                <Select
                  {...field}
                  label="Xác minh"
                  onChange={(event) => {
                    const nextStatus = event.target.value as VerificationStatus;

                    field.onChange(nextStatus);

                    /**
                     * Chỉ tự tắt nhận booking
                     * khi NGƯỜI DÙNG chủ động đổi
                     * verification khỏi verified.
                     *
                     * Không chạy khi load dữ liệu từ API.
                     */
                    if (nextStatus !== "verified") {
                      setValue("isAcceptingBookings", false, {
                        shouldDirty: true,
                      });
                    }
                  }}
                >
                  <MenuItem value="pending">Chờ xác minh</MenuItem>

                  <MenuItem value="verified">Đã xác minh</MenuItem>

                  <MenuItem value="rejected">Từ chối</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <RHFTextField<FormValues>
            name="dateOfBirth"
            label="Ngày sinh"
            type="date"
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <RHFTextField<FormValues>
            name="experienceYears"
            label="Số năm kinh nghiệm"
            type="number"
            fullWidth
            rules={{
              validate: (value) => {
                const number = Number(value);

                if (!Number.isInteger(number) || number < 0 || number > 100) {
                  return "Số năm kinh nghiệm không hợp lệ";
                }

                return true;
              },
            }}
          />

          <RHFTextField<FormValues>
            name="serviceRadiusKm"
            label="Bán kính phục vụ mặc định (km)"
            type="number"
            fullWidth
            rules={{
              validate: (value) => {
                const number = Number(value);

                if (!Number.isFinite(number) || number < 0 || number > 500) {
                  return "Bán kính không hợp lệ";
                }

                return true;
              },
            }}
          />

          <Box
            sx={{
              display: "flex",

              alignItems: "center",
            }}
          >
            <Controller
              name="isAcceptingBookings"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={
                    verificationStatus === "verified"
                      ? "Cho phép nhận booking"
                      : "Cần xác minh trước khi nhận booking"
                  }
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      disabled={verificationStatus !== "verified"}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                />
              )}
            />
          </Box>

          <RHFTextField<FormValues>
            name="stageName"
            label="Nghệ danh"
            slotProps={{
              htmlInput: {
                maxLength: 255,
              },
            }}
          />

          <RHFTextField<FormValues>
            name="address"
            label="Địa chỉ"
            multiline
            minRows={2}
            slotProps={{
              htmlInput: {
                maxLength: 2000,
              },
            }}
          />

          <Controller
            name="hasTattoo"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
                label="Có hình xăm"
              />
            )}
          />

          <Box
            sx={{
              gridColumn: "1 / -1",
            }}
          >
            <RHFTextField<FormValues>
              name="bio"
              label="Giới thiệu"
              multiline
              minRows={4}
              fullWidth
            />
          </Box>
        </Box>

        <Box>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
        </Box>
      </Box>
    </RHFFormProvider>
  );
}
