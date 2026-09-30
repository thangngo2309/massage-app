"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import type { PromotionOperationsVoucherStatusSummary } from "@/lib/promotion-operations-summary";

interface Props {
  data: PromotionOperationsVoucherStatusSummary;
}

const statuses = [
  {
    key: "available",
    label: "Khả dụng",
    color: "success" as const,
  },
  {
    key: "reserved",
    label: "Đã giữ",
    color: "warning" as const,
  },
  {
    key: "used",
    label: "Đã sử dụng",
    color: "info" as const,
  },
  {
    key: "expired",
    label: "Hết hạn",
    color: "default" as const,
  },
  {
    key: "cancelled",
    label: "Đã hủy",
    color: "error" as const,
  },
];

export function VoucherStatusSummary({ data }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Trạng thái voucher người dùng
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Phân bổ voucher đã được cấp cho người dùng.
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {statuses.map((status) => {
          const count = data[status.key] ?? 0;

          return (
            <Box
              key={status.key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Chip
                size="small"
                color={status.color}
                variant="outlined"
                label={status.label}
              />

              <Typography variant="body1" sx={{ fontWeight: 800 }}>
                {count.toLocaleString("vi-VN")}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
