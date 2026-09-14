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

import { useEffect, useState } from "react";

import { Controller, useForm } from "react-hook-form";

import {
  getTherapistServiceOptions,
  type ServiceOptionLookup,
} from "@/lib/therapists";

import {
  searchTherapists,
  type TherapistSearchItem,
  type TherapistSearchSort,
} from "@/lib/therapist-search";

interface FormValues {
  serviceOptionId: number | "";

  date: string;
  startTime: string;

  latitude: string;
  longitude: string;

  provinceCode: string;
  districtCode: string;

  sortBy: TherapistSearchSort;
}

function getTodayVietnam() {
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function TherapistSearchPage() {
  const [serviceOptions, setServiceOptions] = useState<ServiceOptionLookup[]>(
    []
  );

  const [items, setItems] = useState<TherapistSearchItem[]>([]);

  const [loading, setLoading] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(false);

  const [error, setError] = useState("");

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      serviceOptionId: "",

      date: getTodayVietnam(),

      startTime: "09:00",

      latitude: "",
      longitude: "",

      provinceCode: "",
      districtCode: "",

      sortBy: "distance",
    },
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);

        const response = await getTherapistServiceOptions();

        setServiceOptions(
          response.filter((item) => item.isActive && item.serviceIsActive)
        );
      } catch (error) {
        console.error(error);

        setError("Không thể tải danh sách dịch vụ");
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (!values.serviceOptionId) {
      setError("Vui lòng chọn dịch vụ");

      return;
    }

    const hasLatitude = values.latitude.trim() !== "";

    const hasLongitude = values.longitude.trim() !== "";

    if (hasLatitude !== hasLongitude) {
      setError("Latitude và Longitude phải nhập cùng nhau");

      return;
    }

    if (!values.districtCode.trim() && !(hasLatitude && hasLongitude)) {
      setError("Vui lòng nhập District Code hoặc tọa độ khách hàng");

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await searchTherapists({
        serviceOptionId: Number(values.serviceOptionId),

        date: values.date,

        startTime: values.startTime,

        latitude: hasLatitude ? Number(values.latitude) : undefined,

        longitude: hasLongitude ? Number(values.longitude) : undefined,

        provinceCode: values.provinceCode.trim() || undefined,

        districtCode: values.districtCode.trim() || undefined,

        sortBy: values.sortBy,

        page: 1,
        limit: 50,
      });

      setItems(response.items);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tìm kỹ thuật viên"
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 700,
        }}
      >
        Tìm kỹ thuật viên
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mb: 3,
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },

              gap: 2,
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
                  disabled={loadingOptions}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                >
                  {serviceOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.serviceName} -{" "}
                      {option.label ?? `${option.durationMinutes} phút`}
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
                  type="date"
                  fullWidth
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
              name="startTime"
              control={control}
              rules={{
                required: "Vui lòng chọn giờ",
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="time"
                  fullWidth
                  label="Giờ bắt đầu"
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
              name="sortBy"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth label="Sắp xếp">
                  <MenuItem value="distance">Gần nhất</MenuItem>

                  <MenuItem value="rating">Rating cao nhất</MenuItem>

                  <MenuItem value="price">Giá thấp nhất</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Latitude khách"
                  placeholder="16.0544"
                />
              )}
            />

            <Controller
              name="longitude"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Longitude khách"
                  placeholder="108.2022"
                />
              )}
            />

            <Controller
              name="provinceCode"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Province Code" />
              )}
            />

            <Controller
              name="districtCode"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="District Code" />
              )}
            />
          </Box>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SearchIcon />
                )
              }
            >
              Tìm kỹ thuật viên
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
          }}
        >
          {error}
        </Alert>
      )}

      {!loading && !error && items.length === 0 && (
        <Alert severity="info">
          Chưa có kỹ thuật viên phù hợp với điều kiện tìm kiếm.
        </Alert>
      )}

      <Stack spacing={2}>
        {items.map((item) => (
          <Paper
            key={item.therapistId}
            variant="outlined"
            sx={{
              p: 2.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  md: "row",
                },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {item.fullName}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  {item.serviceName} -{" "}
                  {item.optionLabel ?? `${item.durationMinutes} phút`}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{
                    mt: 1.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    size="small"
                    label={`⭐ ${item.ratingAverage} (${item.ratingCount})`}
                  />

                  <Chip
                    size="small"
                    label={`${item.experienceYears} năm kinh nghiệm`}
                  />

                  <Chip
                    size="small"
                    label={
                      item.distanceKm !== null
                        ? `${item.distanceKm} km`
                        : "Chưa có vị trí hiện tại"
                    }
                  />

                  <Chip size="small" color="success" label="Khả dụng" />

                  <Chip
                    size="small"
                    variant="outlined"
                    label={item.onlineStatus}
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  minWidth: 180,
                  textAlign: {
                    xs: "left",
                    md: "right",
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {formatMoney(item.price)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Phí nền tảng: {item.platformFeeRate}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
