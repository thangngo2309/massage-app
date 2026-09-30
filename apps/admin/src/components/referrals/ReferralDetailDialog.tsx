"use client";

import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  Button,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";

import { AdminReferralItem, ReferralStatus } from "@/lib/promotion-operations";

interface Props {
  open: boolean;
  item: AdminReferralItem | null;
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

function getStatusLabel(status: ReferralStatus) {
  switch (status) {
    case "pending":
      return "Đang chờ";

    case "qualified":
      return "Đủ điều kiện";

    case "rewarded":
      return "Đã phát thưởng";

    case "invalid":
      return "Không hợp lệ";

    default:
      return status;
  }
}

function getStatusColor(
  status: ReferralStatus
): "warning" | "info" | "success" | "error" | "default" {
  switch (status) {
    case "pending":
      return "warning";

    case "qualified":
      return "info";

    case "rewarded":
      return "success";

    case "invalid":
      return "error";

    default:
      return "default";
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
        py: 1.2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Box>{children}</Box>
    </Box>
  );
}

export function ReferralDetailDialog({ open, item, onClose }: Props) {
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
            <ShareOutlinedIcon />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Chi tiết giới thiệu
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Referral #{item.id}
            </Typography>
          </Box>
        </Box>

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
              Trạng thái
            </Typography>

            <DetailRow label="Trạng thái hiện tại">
              <Chip
                size="small"
                label={getStatusLabel(item.status)}
                color={getStatusColor(item.status)}
              />
            </DetailRow>

            <DetailRow label="Ngày tạo">
              <Typography variant="body2">
                {formatDateTime(item.createdAt)}
              </Typography>
            </DetailRow>

            <DetailRow label="Đủ điều kiện lúc">
              <Typography variant="body2">
                {formatDateTime(item.qualifiedAt)}
              </Typography>
            </DetailRow>

            <DetailRow label="Phát thưởng lúc">
              <Typography variant="body2">
                {formatDateTime(item.rewardedAt)}
              </Typography>
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Người giới thiệu
            </Typography>

            <DetailRow label="User ID">
              <Typography variant="body2">#{item.referrer.id}</Typography>
            </DetailRow>

            <DetailRow label="Họ tên">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.referrer.fullName}
              </Typography>
            </DetailRow>

            <DetailRow label="Số điện thoại">
              <Typography variant="body2">{item.referrer.phone}</Typography>
            </DetailRow>

            <DetailRow label="Email">
              <Typography variant="body2">
                {item.referrer.email ?? "-"}
              </Typography>
            </DetailRow>

            <DetailRow label="Vai trò">
              <Typography variant="body2">
                {getRoleLabel(item.referrer.role)}
              </Typography>
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Người được giới thiệu
            </Typography>

            <DetailRow label="User ID">
              <Typography variant="body2">#{item.referredUser.id}</Typography>
            </DetailRow>

            <DetailRow label="Họ tên">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.referredUser.fullName}
              </Typography>
            </DetailRow>

            <DetailRow label="Số điện thoại">
              <Typography variant="body2">{item.referredUser.phone}</Typography>
            </DetailRow>

            <DetailRow label="Email">
              <Typography variant="body2">
                {item.referredUser.email ?? "-"}
              </Typography>
            </DetailRow>

            <DetailRow label="Vai trò">
              <Typography variant="body2">
                {getRoleLabel(item.referredUser.role)}
              </Typography>
            </DetailRow>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Mã giới thiệu
            </Typography>

            <DetailRow label="Referral Code ID">
              <Typography variant="body2">#{item.referralCode.id}</Typography>
            </DetailRow>

            <DetailRow label="Mã hiện tại">
              <Chip
                label={item.referralCode.code}
                size="small"
                variant="outlined"
              />
            </DetailRow>

            <DetailRow label="Mã snapshot">
              <Chip label={item.referralCodeSnapshot} size="small" />
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
