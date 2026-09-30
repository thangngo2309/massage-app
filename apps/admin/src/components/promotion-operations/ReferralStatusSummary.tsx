"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import type { PromotionOperationsReferralStatusSummary } from "@/lib/promotion-operations-summary";

interface Props {
  data: PromotionOperationsReferralStatusSummary;
}

const statuses = [
  {
    key: "pending",
    label: "Đang chờ",
    color: "warning" as const,
  },
  {
    key: "qualified",
    label: "Đủ điều kiện",
    color: "info" as const,
  },
  {
    key: "rewarded",
    label: "Đã phát thưởng",
    color: "success" as const,
  },
  {
    key: "invalid",
    label: "Không hợp lệ",
    color: "error" as const,
  },
];

export function ReferralStatusSummary({ data }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Trạng thái giới thiệu
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Theo dõi quá trình xử lý các quan hệ referral.
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
