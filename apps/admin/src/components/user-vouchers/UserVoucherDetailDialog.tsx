"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import { useState } from "react";

import {
  AdminUserVoucherItem,
  cancelAdminUserVoucher,
  UserVoucherSourceType,
  UserVoucherStatus,
} from "@/lib/promotion-operations";

interface Props {
  open: boolean;
  item: AdminUserVoucherItem | null;
  onClose: () => void;
  onChanged: () => void;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusLabel(status: UserVoucherStatus) {
  switch (status) {
    case "available":
      return "Khả dụng";

    case "reserved":
      return "Đã giữ";

    case "used":
      return "Đã sử dụng";

    case "expired":
      return "Hết hạn";

    case "cancelled":
      return "Đã hủy";

    default:
      return status;
  }
}

function getStatusColor(
  status: UserVoucherStatus
): "success" | "warning" | "info" | "error" | "default" {
  switch (status) {
    case "available":
      return "success";

    case "reserved":
      return "warning";

    case "used":
      return "info";

    case "expired":
    case "cancelled":
      return "default";

    default:
      return "default";
  }
}

function getSourceLabel(sourceType: UserVoucherSourceType) {
  switch (sourceType) {
    case "promotion":
      return "Khuyến mãi";

    case "referral":
      return "Giới thiệu";

    case "first_booking":
      return "Booking đầu tiên";

    case "admin":
      return "Admin cấp";

    default:
      return sourceType;
  }
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "180px minmax(0, 1fr)",
        },
        gap: {
          xs: 0.5,
          sm: 2,
        },
        py: 1.25,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Box>{children}</Box>
    </Box>
  );
}

export function UserVoucherDetailDialog({
  open,
  item,
  onClose,
  onChanged,
}: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [cancelling, setCancelling] = useState(false);

  const [confirmCancel, setConfirmCancel] = useState(false);

  const [error, setError] = useState("");

  if (!item) {
    return null;
  }

  const canCancel = item.status === "available" || item.status === "expired";

  const handleCancel = async () => {
    try {
      setCancelling(true);
      setError("");

      await cancelAdminUserVoucher(item.id);

      setConfirmCancel(false);

      onChanged();
      onClose();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Không thể hủy voucher"
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={cancelling ? undefined : onClose}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen}
      >
        <DialogTitle component="div" sx={{ pr: 7 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ConfirmationNumberIcon />
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Chi tiết User Voucher
              </Typography>

              <Typography variant="body2" color="text.secondary">
                #{item.id} · {item.voucher.code}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={onClose}
            disabled={cancelling}
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
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Người nhận
              </Typography>

              <DetailRow label="Họ tên">
                <Typography variant="body2">{item.user.fullName}</Typography>
              </DetailRow>

              <DetailRow label="Số điện thoại">
                <Typography variant="body2">{item.user.phone}</Typography>
              </DetailRow>

              <DetailRow label="Email">
                <Typography variant="body2">
                  {item.user.email ?? "-"}
                </Typography>
              </DetailRow>

              <DetailRow label="Loại tài khoản">
                <Typography variant="body2">
                  {item.user.role === "client"
                    ? "Khách hàng"
                    : item.user.role === "therapist"
                    ? "Kỹ thuật viên"
                    : item.user.role}
                </Typography>
              </DetailRow>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Voucher
              </Typography>

              <DetailRow label="Mã voucher">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.voucher.code}
                </Typography>
              </DetailRow>

              <DetailRow label="Đối tượng">
                <Typography variant="body2">
                  {item.voucher.audience === "client"
                    ? "Khách hàng"
                    : "Kỹ thuật viên"}
                </Typography>
              </DetailRow>

              <DetailRow label="Mức giảm">
                <Typography variant="body2">
                  {item.voucher.discountType === "fixed"
                    ? formatCurrency(item.voucher.discountValue)
                    : `${item.voucher.discountValue}%`}
                </Typography>
              </DetailRow>

              <DetailRow label="Trạng thái">
                <Chip
                  size="small"
                  label={getStatusLabel(item.status)}
                  color={getStatusColor(item.status)}
                  variant={
                    item.status === "expired" || item.status === "cancelled"
                      ? "outlined"
                      : "filled"
                  }
                />
              </DetailRow>

              <DetailRow label="Ngày cấp">
                <Typography variant="body2">
                  {formatDateTime(item.createdAt)}
                </Typography>
              </DetailRow>

              <DetailRow label="Hết hạn">
                <Typography variant="body2">
                  {formatDateTime(item.expiresAt)}
                </Typography>
              </DetailRow>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Nguồn cấp
              </Typography>

              <DetailRow label="Nguồn">
                <Chip
                  size="small"
                  label={getSourceLabel(item.sourceType)}
                  variant="outlined"
                />
              </DetailRow>

              <DetailRow label="Reference">
                <Typography
                  variant="body2"
                  sx={{
                    wordBreak: "break-all",
                  }}
                >
                  {item.sourceReferenceId ?? "-"}
                </Typography>
              </DetailRow>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Booking
              </Typography>

              <DetailRow label="Booking đang giữ">
                <Typography variant="body2">
                  {item.reservedBookingId ? `#${item.reservedBookingId}` : "-"}
                </Typography>
              </DetailRow>

              <DetailRow label="Thời điểm giữ">
                <Typography variant="body2">
                  {formatDateTime(item.reservedAt)}
                </Typography>
              </DetailRow>

              <DetailRow label="Booking đã dùng">
                <Typography variant="body2">
                  {item.usedBookingId ? `#${item.usedBookingId}` : "-"}
                </Typography>
              </DetailRow>

              <DetailRow label="Thời điểm sử dụng">
                <Typography variant="body2">
                  {formatDateTime(item.usedAt)}
                </Typography>
              </DetailRow>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {canCancel && (
            <Button
              color="error"
              startIcon={<CancelOutlinedIcon />}
              disabled={cancelling}
              onClick={() => setConfirmCancel(true)}
            >
              Hủy voucher
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          <Button color="inherit" onClick={onClose} disabled={cancelling}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmCancel}
        onClose={cancelling ? undefined : () => setConfirmCancel(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle component="div">Xác nhận hủy voucher</DialogTitle>

        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc muốn hủy voucher <strong>{item.voucher.code}</strong>{" "}
            của <strong>{item.user.fullName}</strong>?
          </Typography>

          <Alert severity="warning" sx={{ mt: 2 }}>
            User Voucher sau khi chuyển sang trạng thái đã hủy sẽ không thể sử
            dụng.
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button
            color="inherit"
            disabled={cancelling}
            onClick={() => setConfirmCancel(false)}
          >
            Không
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={cancelling}
            onClick={() => void handleCancel()}
          >
            {cancelling ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Xác nhận hủy"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
