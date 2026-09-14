"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { updateBookingStatus, type BookingStatus } from "@/lib/bookings";

import { BOOKING_STATUS_LABELS } from "./BookingStatusChip";

interface Props {
  open: boolean;
  bookingId: number | null;
  currentStatus: BookingStatus | null;
  nextStatus: BookingStatus | null;

  onClose: () => void;
  onChanged: () => void;
}

interface FormValues {
  reason: string;
}

const NEED_REASON_STATUSES: BookingStatus[] = [
  "cancelled_by_admin",
  "rejected",
  "expired",
];

export function BookingStatusDialog({
  open,
  bookingId,
  currentStatus,
  nextStatus,
  onClose,
  onChanged,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      reason: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        reason: "",
      });

      setError("");
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!bookingId || !nextStatus) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateBookingStatus(bookingId, {
        status: nextStatus,
        reason: values.reason.trim() || undefined,
      });

      onChanged();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái booking"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!nextStatus) {
    return null;
  }

  const needReason = NEED_REASON_STATUSES.includes(nextStatus);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle component="div">
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Cập nhật trạng thái booking
        </Typography>

        {currentStatus && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            {BOOKING_STATUS_LABELS[currentStatus]}
            {" → "}
            {BOOKING_STATUS_LABELS[nextStatus]}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          sx={{
            pt: 1,
          }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <Controller
            name="reason"
            control={control}
            rules={{
              validate: (value) => {
                if (needReason && !value.trim()) {
                  return "Vui lòng nhập lý do";
                }

                return true;
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                minRows={3}
                label={needReason ? "Lý do" : "Ghi chú / lý do"}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Đóng
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? "Đang cập nhật..." : "Xác nhận"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
