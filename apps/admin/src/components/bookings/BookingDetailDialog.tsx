"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getBooking,
  type BookingItem,
  type BookingStatus,
} from "@/lib/bookings";

import { BookingStatusChip, BOOKING_STATUS_LABELS } from "./BookingStatusChip";

import { BookingStatusDialog } from "./BookingStatusDialog";

interface Props {
  open: boolean;
  bookingId: number | null;

  onClose: () => void;
  onChanged: () => void;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const NEXT_STATUSES: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending: [
    "searching_therapist",
    "waiting_therapist_accept",
    "cancelled_by_admin",
    "expired",
  ],

  searching_therapist: [
    "waiting_therapist_accept",
    "cancelled_by_admin",
    "expired",
  ],

  waiting_therapist_accept: [
    "confirmed",
    "rejected",
    "cancelled_by_admin",
    "expired",
  ],

  confirmed: ["therapist_on_the_way", "cancelled_by_admin"],

  therapist_on_the_way: ["arrived", "cancelled_by_admin"],

  arrived: ["in_progress", "cancelled_by_admin"],

  in_progress: ["completed", "cancelled_by_admin"],
};

export function BookingDetailDialog({
  open,
  bookingId,
  onClose,
  onChanged,
}: Props) {
  const [detail, setDetail] = useState<BookingItem | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [nextStatus, setNextStatus] = useState<BookingStatus | null>(null);

  const loadData = useCallback(async () => {
    if (!bookingId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getBooking(bookingId);

      setDetail(response);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải booking"
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDetail(null);
    setNextStatus(null);

    void loadData();
  }, [open, loadData]);

  const availableStatuses = useMemo(() => {
    if (!detail) {
      return [];
    }

    return NEXT_STATUSES[detail.status] ?? [];
  }, [detail]);

  const handleChangeStatus = (status: BookingStatus) => {
    setNextStatus(status);
    setStatusDialogOpen(true);
  };

  const handleStatusChanged = () => {
    void loadData();

    onChanged();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle
          component="div"
          sx={{
            pr: 7,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: "wrap", alignItems: "center" }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              {detail?.bookingCode ?? "Chi tiết booking"}
            </Typography>

            {detail && <BookingStatusChip status={detail.status} />}
          </Stack>

          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
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
                minHeight: 300,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : detail ? (
            <Stack spacing={3}>
              {availableStatuses.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                  }}
                >
                  <Typography
                    sx={{
                      mb: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    Thao tác trạng thái
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: "wrap" }}
                  >
                    {availableStatuses.map((status) => (
                      <Button
                        key={status}
                        variant="outlined"
                        color={
                          status === "cancelled_by_admin" ||
                          status === "rejected"
                            ? "error"
                            : status === "completed"
                            ? "success"
                            : "primary"
                        }
                        onClick={() => handleChangeStatus(status)}
                      >
                        {BOOKING_STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </Stack>
                </Paper>
              )}

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
                <InfoSection
                  title="Thông tin booking"
                  items={[
                    ["Mã booking", detail.bookingCode],
                    ["Trạng thái", BOOKING_STATUS_LABELS[detail.status]],
                    ["Thời gian hẹn", formatDateTime(detail.scheduledAt)],
                    ["Dự kiến kết thúc", formatDateTime(detail.expectedEndAt)],
                    ["Ngày tạo", formatDateTime(detail.createdAt)],
                  ]}
                />

                <InfoSection
                  title="Dịch vụ"
                  items={[
                    ["Dịch vụ", detail.serviceName],
                    ["Thời lượng", `${detail.durationMinutes} phút`],
                    ["Giá dịch vụ", formatMoney(Number(detail.servicePrice))],
                    ["Phí nền tảng", formatMoney(Number(detail.platformFee))],
                    ["Thuế", formatMoney(Number(detail.taxAmount))],
                    ["Tổng tiền", formatMoney(Number(detail.totalAmount))],
                  ]}
                />

                <InfoSection
                  title="Khách hàng"
                  items={[
                    ["Họ tên", detail.client?.user?.fullName ?? "-"],
                    ["Điện thoại", detail.client?.user?.phone ?? "-"],
                    ["Email", detail.client?.user?.email ?? "-"],
                  ]}
                />

                <InfoSection
                  title="Kỹ thuật viên"
                  items={[
                    ["Họ tên", detail.therapist?.user?.fullName ?? "-"],
                    ["Điện thoại", detail.therapist?.user?.phone ?? "-"],
                    ["Email", detail.therapist?.user?.email ?? "-"],
                  ]}
                />
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                }}
              >
                <Typography
                  sx={{
                    mb: 1.5,
                    fontWeight: 700,
                  }}
                >
                  Địa điểm thực hiện
                </Typography>

                <Typography>{detail.address}</Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  {detail.latitude}, {detail.longitude}
                </Typography>

                {detail.clientNote && (
                  <>
                    <Divider
                      sx={{
                        my: 2,
                      }}
                    />

                    <Typography
                      sx={{
                        mb: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Ghi chú khách hàng
                    </Typography>

                    <Typography>{detail.clientNote}</Typography>
                  </>
                )}
              </Paper>

              <InfoSection
                title="Mốc thời gian"
                items={[
                  ["Được chấp nhận", formatDateTime(detail.acceptedAt)],
                  ["Đã đến", formatDateTime(detail.arrivedAt)],
                  ["Bắt đầu", formatDateTime(detail.startedAt)],
                  ["Hoàn thành", formatDateTime(detail.completedAt)],
                  ["Đã hủy", formatDateTime(detail.cancelledAt)],
                  ["Lý do hủy", detail.cancellationReason ?? "-"],
                ]}
              />

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                }}
              >
                <Typography
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                  }}
                >
                  Lịch sử trạng thái
                </Typography>

                {!detail.statusHistories?.length ? (
                  <Alert severity="info">Chưa có lịch sử trạng thái.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {[...detail.statusHistories]
                      .sort(
                        (a, b) =>
                          new Date(a.createdAt).getTime() -
                          new Date(b.createdAt).getTime()
                      )
                      .map((history) => (
                        <Paper
                          key={history.id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            {history.fromStatus
                              ? `${
                                  BOOKING_STATUS_LABELS[history.fromStatus]
                                } → `
                              : ""}
                            {BOOKING_STATUS_LABELS[history.toStatus]}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                            }}
                          >
                            {formatDateTime(history.createdAt)}
                            {history.changedByUser?.fullName
                              ? ` • ${history.changedByUser.fullName}`
                              : ""}
                          </Typography>

                          {history.reason && (
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.5,
                              }}
                            >
                              Lý do: {history.reason}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>

      <BookingStatusDialog
        open={statusDialogOpen}
        bookingId={detail?.id ?? null}
        currentStatus={detail?.status ?? null}
        nextStatus={nextStatus}
        onClose={() => setStatusDialogOpen(false)}
        onChanged={handleStatusChanged}
      />
    </>
  );
}

function InfoSection({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
      }}
    >
      <Typography
        sx={{
          mb: 1.5,
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>

      <Stack spacing={1}>
        {items.map(([label, value]) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                wordBreak: "break-word",
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
