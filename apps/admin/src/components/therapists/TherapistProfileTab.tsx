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
   * Theo dõi trạng thái xác minh hiện tại
   * trên form.
   */
  const verificationStatus = watch("verificationStatus");

  /**
   * Khi load lại detail từ API
   * thì đồng bộ dữ liệu vào form.
   */
  useEffect(() => {
    reset({
      bio: detail.bio ?? "",

      gender: detail.gender,

      dateOfBirth: detail.dateOfBirth ?? "",

      experienceYears: String(detail.experienceYears),

      serviceRadiusKm: String(detail.serviceRadiusKm),

      isAcceptingBookings: detail.isAcceptingBookings,

      verificationStatus: detail.verificationStatus,
    });
  }, [detail, reset]);

  /**
   * Chỉ KTV đã VERIFIED
   * mới được phép nhận booking.
   *
   * Nếu chuyển từ verified sang
   * pending/rejected thì tự tắt
   * isAcceptingBookings.
   */
  useEffect(() => {
    if (verificationStatus !== "verified") {
      setValue("isAcceptingBookings", false);
    }
  }, [verificationStatus, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      setError("");

      const verificationChanged =
        values.verificationStatus !== detail.verificationStatus;

      /**
       * Trường hợp:
       *
       * pending/rejected -> verified
       *
       * Phải xác minh trước,
       * sau đó mới cho update
       * isAcceptingBookings=true.
       */
      if (verificationChanged && values.verificationStatus === "verified") {
        await updateTherapistVerification(
          detail.userId,
          values.verificationStatus
        );
      }

      /**
       * Update thông tin profile.
       */
      await updateTherapistProfile(detail.userId, {
        bio: values.bio.trim() || null,

        gender: values.gender,

        dateOfBirth: values.dateOfBirth || null,

        experienceYears: Number(values.experienceYears),

        serviceRadiusKm: Number(values.serviceRadiusKm),

        isAcceptingBookings: values.isAcceptingBookings,
      });

      /**
       * Trường hợp:
       *
       * verified -> pending/rejected
       *
       * Update profile trước
       * với accepting=false,
       * sau đó mới thay trạng thái
       * verification.
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
          {/* ========================= */}
          {/* GENDER */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* VERIFICATION */}
          {/* ========================= */}

          <Controller
            name="verificationStatus"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Xác minh</InputLabel>

                <Select {...field} label="Xác minh">
                  <MenuItem value="pending">Chờ xác minh</MenuItem>

                  <MenuItem value="verified">Đã xác minh</MenuItem>

                  <MenuItem value="rejected">Từ chối</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          {/* ========================= */}
          {/* DATE OF BIRTH */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* EXPERIENCE */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* SERVICE RADIUS */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* ACCEPTING BOOKINGS */}
          {/* ========================= */}

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
                      checked={field.value}
                      /**
                       * Đây chính là đoạn
                       * mình nói bạn thêm.
                       *
                       * KTV chưa VERIFIED
                       * thì Switch bị disable.
                       */
                      disabled={verificationStatus !== "verified"}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                />
              )}
            />
          </Box>

          {/* ========================= */}
          {/* BIO */}
          {/* ========================= */}

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
