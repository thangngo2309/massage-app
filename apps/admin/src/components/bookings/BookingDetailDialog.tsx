"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
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
  type BookingServiceItem,
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

    maximumFractionDigits: 0,
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

function formatPercent(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return "0%";
  }

  return `${numberValue}%`;
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

  /**
   * ============================================================
   * MULTI-SERVICE ITEMS
   * ============================================================
   *
   * Booking cũ vẫn fallback về legacy single-service fields.
   */
  const serviceItems = useMemo<BookingServiceItem[]>(() => {
    if (!detail) {
      return [];
    }

    if (detail.items?.length) {
      return [...detail.items].sort(
        (left, right) => left.sortOrder - right.sortOrder
      );
    }

    return [
      {
        id: -detail.id,

        bookingId: detail.id,

        serviceId: 0,

        serviceOptionId: detail.serviceOptionId,

        therapistServiceId: detail.therapistServiceId,

        serviceName: detail.serviceName,

        optionLabel: null,

        durationMinutes: detail.durationMinutes,

        price: Number(detail.servicePrice),

        platformFeeRate: 0,

        platformFee: Number(detail.platformFee),

        sortOrder: 0,
      },
    ];
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
      <Dialog
        open={open}
        onClose={loading ? undefined : onClose}
        fullWidth
        maxWidth="lg"
      >
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
            sx={{
              flexWrap: "wrap",

              alignItems: "center",
            }}
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
            disabled={loading}
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
              {/* ================================================
                  STATUS ACTIONS
              ================================================ */}

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
                    sx={{
                      flexWrap: "wrap",
                    }}
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

              {/* ================================================
                  GENERAL INFORMATION
              ================================================ */}

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

                <InfoSection
                  title="Tổng quan dịch vụ"
                  items={[
                    ["Số dịch vụ", `${serviceItems.length} dịch vụ`],

                    ["Tổng thời lượng", `${detail.durationMinutes} phút`],

                    ["Tạm tính", formatMoney(Number(detail.servicePrice))],

                    [
                      "Khách thanh toán",
                      formatMoney(Number(detail.totalAmount)),
                    ],
                  ]}
                />
              </Box>

              {/* ================================================
                  MULTI-SERVICE DETAIL
              ================================================ */}

              <ServiceItemsSection items={serviceItems} />

              {/* ================================================
                  PAYMENT SUMMARY
              ================================================ */}

              <PaymentSummarySection detail={detail} />

              {/* ================================================
                  LOCATION
              ================================================ */}

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
                  {detail.latitude}
                  {", "}
                  {detail.longitude}
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

                    <Typography
                      sx={{
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {detail.clientNote}
                    </Typography>
                  </>
                )}
              </Paper>

              {/* ================================================
                  TIMESTAMPS
              ================================================ */}

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

              {/* ================================================
                  STATUS HISTORY
              ================================================ */}

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

/**
 * ============================================================
 * SERVICE ITEMS
 * ============================================================
 */
function ServiceItemsSection({ items }: { items: BookingServiceItem[] }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          mb: 2,

          flexWrap: "wrap",

          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
          }}
        >
          Dịch vụ trong booking
        </Typography>

        <Chip
          size="small"
          label={`${items.length} dịch vụ`}
          variant="outlined"
        />
      </Stack>

      <Stack spacing={1.5}>
        {items.map((item, index) => {
          const optionLabel =
            item.optionLabel || item.serviceOption?.label || "-";

          return (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: 2,

                bgcolor: "background.default",
              }}
            >
              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr",

                    md: "minmax(0, 1fr) auto",
                  },

                  gap: 2,

                  alignItems: "start",
                }}
              >
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{
                      flexWrap: "wrap",

                      alignItems: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                      {". "}
                      {item.serviceName}
                    </Typography>

                    <Chip size="small" label={optionLabel} />
                  </Stack>

                  <Box
                    sx={{
                      mt: 1.5,

                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",

                        sm: "repeat(3, minmax(0, 1fr))",
                      },

                      gap: 1.5,
                    }}
                  >
                    <ItemMetric
                      label="Thời lượng"
                      value={`${item.durationMinutes} phút`}
                    />

                    <ItemMetric
                      label="Tỷ lệ phí nền tảng"
                      value={formatPercent(item.platformFeeRate)}
                    />

                    <ItemMetric
                      label="Phí nền tảng"
                      value={formatMoney(Number(item.platformFee || 0))}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    textAlign: {
                      xs: "left",

                      md: "right",
                    },
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Giá dịch vụ
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,

                      fontWeight: 700,

                      fontSize: "1.05rem",
                    }}
                  >
                    {formatMoney(Number(item.price))}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
}

/**
 * ============================================================
 * PAYMENT SUMMARY
 * ============================================================
 */
function PaymentSummarySection({ detail }: { detail: BookingItem }) {
  const discountAmount = Number(detail.discountAmount ?? 0);

  const taxAmount = Number(detail.taxAmount ?? 0);

  const platformFee = Number(detail.platformFee ?? 0);

  return (
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
        Chi phí booking
      </Typography>

      <Stack spacing={1.25}>
        <SummaryRow
          label="Tổng giá dịch vụ"
          value={formatMoney(Number(detail.servicePrice))}
        />

        <SummaryRow label="Thuế" value={formatMoney(taxAmount)} />

        {detail.voucherCode && (
          <SummaryRow label="Mã voucher" value={detail.voucherCode} />
        )}

        {discountAmount > 0 && (
          <SummaryRow
            label="Giảm giá"
            value={`-${formatMoney(discountAmount)}`}
            valueColor="success.main"
          />
        )}

        <Divider />

        <SummaryRow
          label="Khách thanh toán"
          value={formatMoney(Number(detail.totalAmount))}
          strong
        />

        <Divider />

        <SummaryRow
          label="Phí nền tảng thu KTV"
          value={formatMoney(platformFee)}
          valueColor="primary.main"
        />

        <Typography variant="caption" color="text.secondary">
          Phí nền tảng được tính riêng cho kỹ thuật viên và không cộng thêm vào
          số tiền khách thanh toán.
        </Typography>
      </Stack>
    </Paper>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  valueColor,
}: {
  label: string;

  value: string;

  strong?: boolean;

  valueColor?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",

        justifyContent: "space-between",

        alignItems: "flex-start",

        gap: 2,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontWeight: strong ? 700 : 400,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant={strong ? "subtitle1" : "body2"}
        sx={{
          fontWeight: strong ? 700 : 600,

          color: valueColor,

          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ItemMetric({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mt: 0.25,

          fontWeight: 600,
        }}
      >
        {value}
      </Typography>
    </Box>
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

              gridTemplateColumns: {
                xs: "120px minmax(0, 1fr)",

                sm: "140px minmax(0, 1fr)",
              },

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
