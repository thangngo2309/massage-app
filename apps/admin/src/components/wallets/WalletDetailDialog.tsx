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
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

import type { ReactNode } from "react";

import { AdminWalletItem, WalletType } from "@/lib/promotion-operations";

interface Props {
  open: boolean;
  item: AdminWalletItem | null;
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
        gap: { xs: 0.5, sm: 2 },
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

export function WalletDetailDialog({ open, item, onClose }: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (!item) {
    return null;
  }

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
            <AccountBalanceWalletOutlinedIcon />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Chi tiết ví
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Wallet #{item.id}
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
              Thông tin ví
            </Typography>

            <DetailRow label="Wallet ID">
              <Typography variant="body2">#{item.id}</Typography>
            </DetailRow>

            <DetailRow label="Loại ví">
              <Chip
                size="small"
                label={getWalletTypeLabel(item.type)}
                color={item.type === "promotion" ? "secondary" : "primary"}
              />
            </DetailRow>

            <DetailRow label="Số dư">
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {formatCurrency(item.balance)}
              </Typography>
            </DetailRow>

            <DetailRow label="Ngày tạo">
              <Typography variant="body2">
                {formatDateTime(item.createdAt)}
              </Typography>
            </DetailRow>

            <DetailRow label="Cập nhật">
              <Typography variant="body2">
                {formatDateTime(item.updatedAt)}
              </Typography>
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Chủ ví
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
