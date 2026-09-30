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
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

import type { ReactNode } from "react";

import {
  AdminWalletTransactionItem,
  WalletTransactionType,
  WalletType,
} from "@/lib/promotion-operations";

interface Props {
  open: boolean;
  item: AdminWalletTransactionItem | null;
  onClose: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getWalletTypeLabel(type: WalletType) {
  return type === "main" ? "Ví chính" : "Ví khuyến mãi";
}

function getTransactionTypeLabel(type: WalletTransactionType) {
  switch (type) {
    case "topup":
      return "Nạp tiền";

    case "withdraw":
      return "Rút tiền";

    case "payment":
      return "Thanh toán";

    case "refund":
      return "Hoàn tiền";

    case "adjustment":
      return "Điều chỉnh";

    case "promotion_reward":
      return "Thưởng khuyến mãi";

    default:
      return type;
  }
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
          sm: "180px minmax(0, 1fr)",
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

export function WalletTransactionDetailDialog({ open, item, onClose }: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (!item) {
    return null;
  }

  const amount = Number(item.amount);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
            <ReceiptLongOutlinedIcon />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Chi tiết giao dịch
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Transaction #{item.id}
            </Typography>
          </Box>
        </Stack>

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
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Giao dịch
            </Typography>

            <DetailRow label="Loại giao dịch">
              <Chip
                size="small"
                label={getTransactionTypeLabel(item.type)}
                color={item.type === "promotion_reward" ? "success" : "default"}
              />
            </DetailRow>

            <DetailRow label="Số tiền">
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color:
                    amount > 0
                      ? "success.main"
                      : amount < 0
                      ? "error.main"
                      : "text.primary",
                }}
              >
                {amount > 0 ? "+" : ""}
                {formatCurrency(amount)}
              </Typography>
            </DetailRow>

            <DetailRow label="Reference ID">
              <Typography
                variant="body2"
                sx={{
                  fontFamily: item.referenceId ? "monospace" : undefined,
                  wordBreak: "break-all",
                }}
              >
                {item.referenceId ?? "-"}
              </Typography>
            </DetailRow>

            <DetailRow label="Mô tả">
              <Typography variant="body2">{item.description ?? "-"}</Typography>
            </DetailRow>

            <DetailRow label="Thời gian">
              <Typography variant="body2">
                {formatDateTime(item.createdAt)}
              </Typography>
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Ví
            </Typography>

            <DetailRow label="Wallet ID">
              <Typography variant="body2">#{item.walletId}</Typography>
            </DetailRow>

            <DetailRow label="Loại ví">
              <Chip
                size="small"
                variant="outlined"
                label={getWalletTypeLabel(item.walletType)}
              />
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Người dùng
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
