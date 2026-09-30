"use client";

import {
  Box,
  Button,
  Chip,
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
import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";

import type { ReactNode } from "react";

import { AdminPromotionUsageItem } from "@/lib/promotion-operations";

interface Props {
  open: boolean;
  item: AdminPromotionUsageItem | null;
  onClose: () => void;
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
  }).format(Number(value));
}

function getRoleLabel(role: string) {
  switch (role) {
    case "client":
      return "Khách hàng";

    case "therapist":
      return "Kỹ thuật viên";

    case "super_admin":
      return "Super Admin";

    case "system_admin":
      return "System Admin";

    default:
      return role;
  }
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "190px minmax(0, 1fr)",
        },
        gap: {
          xs: 0.5,
          sm: 2,
        },
        py: 1.2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export function PromotionRewardDetailDialog({ open, item, onClose }: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (!item) {
    return null;
  }

  const rewardAmount = Number(item.rewardAmount);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
    >
      <DialogTitle component="div" sx={{ pr: 7 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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
            <RedeemOutlinedIcon />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Chi tiết phát thưởng
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Promotion Usage #{item.id}
            </Typography>
          </Box>
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
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Chương trình khuyến mãi
            </Typography>

            <DetailRow label="Promotion ID">
              <Typography variant="body2">#{item.promotionId}</Typography>
            </DetailRow>

            <DetailRow label="Mã chương trình">
              <Chip
                size="small"
                label={item.promotionCode}
                variant="outlined"
              />
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Người nhận thưởng
            </Typography>

            <DetailRow label="User ID">
              <Typography variant="body2">#{item.user.id}</Typography>
            </DetailRow>

            <DetailRow label="Họ tên">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.user.fullName}
              </Typography>
            </DetailRow>

            <DetailRow label="Số điện thoại">
              <Typography variant="body2">{item.user.phone}</Typography>
            </DetailRow>

            <DetailRow label="Email">
              <Typography variant="body2">{item.user.email ?? "-"}</Typography>
            </DetailRow>

            <DetailRow label="Vai trò">
              <Typography variant="body2">
                {getRoleLabel(item.user.role)}
              </Typography>
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Kết quả phát thưởng
            </Typography>

            <DetailRow label="Giá trị reward">
              <Typography variant="body1" sx={{ fontWeight: 800 }}>
                {rewardAmount !== 0 ? formatCurrency(rewardAmount) : "-"}
              </Typography>
            </DetailRow>

            <DetailRow label="Booking">
              <Typography variant="body2">
                {item.bookingId ? `#${item.bookingId}` : "-"}
              </Typography>
            </DetailRow>

            <DetailRow label="Mã booking">
              <Typography variant="body2">{item.bookingCode ?? "-"}</Typography>
            </DetailRow>

            <DetailRow label="Referral">
              <Typography variant="body2">
                {item.referralId ? `#${item.referralId}` : "-"}
              </Typography>
            </DetailRow>

            <DetailRow label="Thời điểm">
              <Typography variant="body2">
                {formatDateTime(item.createdAt)}
              </Typography>
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Idempotency
            </Typography>

            <DetailRow label="Unique Key">
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                {item.uniqueKey}
              </Typography>
            </DetailRow>

            <Typography variant="caption" color="text.secondary">
              Unique Key được Promotion Engine sử dụng để ngăn cùng một reward
              bị phát nhiều lần.
            </Typography>
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
        <Button color="inherit" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
