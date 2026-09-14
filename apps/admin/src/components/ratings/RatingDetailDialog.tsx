"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";

import { Controller, useForm } from "react-hook-form";

import { useCallback, useEffect, useState } from "react";

import {
  getRating,
  updateRatingModeration,
  type RatingItem,
} from "@/lib/ratings";

interface Props {
  open: boolean;
  ratingId: number | null;

  onClose: () => void;
  onChanged: () => void;
}

interface FormValues {
  isVisible: boolean;
  adminNote: string;
}

export function RatingDetailDialog({
  open,
  ratingId,
  onClose,
  onChanged,
}: Props) {
  const [detail, setDetail] = useState<RatingItem | null>(null);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      isVisible: true,
      adminNote: "",
    },
  });

  const loadData = useCallback(async () => {
    if (!ratingId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getRating(ratingId);

      setDetail(response);

      reset({
        isVisible: response.isVisible,

        adminNote: response.adminNote ?? "",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải đánh giá"
      );
    } finally {
      setLoading(false);
    }
  }, [ratingId, reset]);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, loadData]);

  const onSubmit = async (values: FormValues) => {
    if (!ratingId) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateRatingModeration(ratingId, {
        isVisible: values.isVisible,

        adminNote: values.adminNote.trim() || null,
      });

      await loadData();

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể cập nhật đánh giá"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        component="div"
        sx={{
          pr: 7,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Chi tiết đánh giá
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",

            right: 12,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {loading && !detail ? (
          <Box
            sx={{
              minHeight: 240,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : detail ? (
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
              }}
            >
              <Stack direction="row" spacing={0.5} sx={{alignItems: "center"}}>
                {Array.from({
                  length: detail.rating,
                }).map((_, index) => (
                  <StarIcon key={index} color="warning" />
                ))}

                <Typography
                  sx={{
                    ml: 1,
                    fontWeight: 700,
                  }}
                >
                  {detail.rating}/5
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 2,
                }}
              >
                {detail.comment || "Khách hàng không để lại nhận xét."}
              </Typography>
            </Paper>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },

                gap: 2,
              }}
            >
              <Info
                title="Booking"
                value={detail.booking?.bookingCode ?? "-"}
              />

              <Info
                title="Dịch vụ"
                value={detail.booking?.serviceName ?? "-"}
              />

              <Info
                title="Khách hàng"
                value={detail.client?.user?.fullName ?? "-"}
              />

              <Info
                title="Kỹ thuật viên"
                value={detail.therapist?.user?.fullName ?? "-"}
              />
            </Box>

            <Controller
              name="isVisible"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Hiển thị đánh giá"
                />
              )}
            />

            <Controller
              name="adminNote"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={3}
                  label="Ghi chú Admin"
                />
              )}
            />
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Đóng
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={saving || !detail}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.25,
          fontWeight: 600,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
