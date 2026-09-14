"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Controller, useForm } from "react-hook-form";
import { useMemo, useState } from "react";

import {
  getTherapistAvailabilitySlotsApi,
  type TherapistAvailabilitySlotsResponse,
  type TherapistUnavailableReason,
} from "@/lib/therapist-availability";

export interface TherapistAvailabilityServiceOption {
  id: number;
  serviceId: number;

  serviceName: string;
  label: string;

  durationMinutes: number;
}

interface Props {
  therapistId: number;

  serviceOptions: TherapistAvailabilityServiceOption[];
}

interface FormValues {
  serviceOptionId: number | "";

  date: string;

  slotInterval: number;
}

const reasonLabels: Record<TherapistUnavailableReason, string> = {
  therapist_inactive: "Tài khoản therapist không hoạt động",

  not_verified: "Therapist chưa được xác thực",

  not_accepting_bookings: "Therapist đang tắt nhận lịch",

  service_option_unavailable: "Gói dịch vụ không khả dụng",

  service_not_supported: "Therapist không cung cấp dịch vụ này",

  outside_working_hours: "Ngoài giờ làm việc",

  schedule_exception: "Nằm trong lịch nghỉ / ngoại lệ",

  booking_conflict: "Trùng với lịch đặt khác",

  past_time: "Khung giờ đã qua",
};

function getTodayInVietnam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",

    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((item) => item.type === "year")?.value;

  const month = parts.find((item) => item.type === "month")?.value;

  const day = parts.find((item) => item.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function TherapistAvailabilityTab({
  therapistId,
  serviceOptions,
}: Props) {
  const [result, setResult] =
    useState<TherapistAvailabilitySlotsResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      serviceOptionId: serviceOptions[0]?.id ?? "",

      date: getTodayInVietnam(),

      slotInterval: 30,
    },
  });

  const selectedServiceOptionId = watch("serviceOptionId");

  const selectedOption = useMemo(
    () =>
      serviceOptions.find(
        (item) => item.id === Number(selectedServiceOptionId)
      ),
    [serviceOptions, selectedServiceOptionId]
  );

  const onSubmit = async (values: FormValues) => {
    if (!values.serviceOptionId) {
      setError("Vui lòng chọn dịch vụ");

      return;
    }

    const option = serviceOptions.find(
      (item) => item.id === Number(values.serviceOptionId)
    );

    if (!option) {
      setError("Không tìm thấy dịch vụ");

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getTherapistAvailabilitySlotsApi(therapistId, {
        serviceId: option.serviceId,

        serviceOptionId: option.id,

        date: values.date,

        slotInterval: values.slotInterval,
      });

      setResult(response);
    } catch (error) {
      console.error(error);

      setError("Không thể tải lịch khả dụng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 700,
          }}
        >
          Kiểm tra lịch khả dụng
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "2fr 1fr 1fr auto",
            },
            gap: 2,
            alignItems: "start",
          }}
        >
          <Controller
            name="serviceOptionId"
            control={control}
            rules={{
              required: "Vui lòng chọn dịch vụ",
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Dịch vụ"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(event) => field.onChange(Number(event.target.value))}
              >
                {serviceOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.serviceName} - {option.label} (
                    {option.durationMinutes} phút)
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="date"
            control={control}
            rules={{
              required: "Vui lòng chọn ngày",
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label="Ngày"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            )}
          />

          <Controller
            name="slotInterval"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Khoảng slot"
                onChange={(event) => field.onChange(Number(event.target.value))}
              >
                <MenuItem value={15}>15 phút</MenuItem>

                <MenuItem value={30}>30 phút</MenuItem>

                <MenuItem value={60}>60 phút</MenuItem>
              </TextField>
            )}
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            disabled={loading || !serviceOptions.length}
            sx={{
              minHeight: 56,
              whiteSpace: "nowrap",
            }}
          >
            Kiểm tra
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {!serviceOptions.length && (
        <Alert severity="warning">Therapist chưa được cấu hình dịch vụ.</Alert>
      )}

      {result && !result.available && result.reason && (
        <Alert severity="warning">{reasonLabels[result.reason]}</Alert>
      )}

      {result && result.available && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
          }}
        >
          <Stack
            spacing={0.5}
            sx={{
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Lịch khả dụng ngày{" "}
              {new Date(`${result.date}T00:00:00`).toLocaleDateString("vi-VN")}
            </Typography>

            <Typography color="text.secondary">
              Thời lượng dịch vụ: {result.durationMinutes} phút
            </Typography>

            {selectedOption && (
              <Typography color="text.secondary">
                {selectedOption.serviceName} - {selectedOption.label}
              </Typography>
            )}
          </Stack>

          {!result.slots.length ? (
            <Alert severity="info">
              Không có ca làm việc phù hợp trong ngày này.
            </Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                  lg: "repeat(5, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              {result.slots.map((slot) => (
                <Paper
                  key={`${slot.startTime}-${slot.endTime}`}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {slot.startTime} - {slot.endTime}
                  </Typography>

                  <Chip
                    size="small"
                    color={
                      slot.available
                        ? "success"
                        : slot.reason === "past_time"
                        ? "default"
                        : "error"
                    }
                    label={
                      slot.available
                        ? "Có thể nhận"
                        : slot.reason
                        ? reasonLabels[slot.reason]
                        : "Không khả dụng"
                    }
                    sx={{
                      width: "fit-content",
                    }}
                  />
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Stack>
  );
}
