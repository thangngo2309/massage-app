"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";

import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

import type { PromotionOperationsTotals } from "@/lib/promotion-operations-summary";

interface Props {
  totals: PromotionOperationsTotals;
}

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, description, icon }: SummaryCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: "action.hover",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              mt: 0.5,
              fontWeight: 800,
            }}
          >
            {value.toLocaleString("vi-VN")}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export function PromotionOperationsSummaryCards({ totals }: Props) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(4, minmax(0, 1fr))",
        },
        gap: 2,
      }}
    >
      <SummaryCard
        title="Lượt phát thưởng"
        value={totals.promotionUsages}
        description="Promotion Usage đã được ghi nhận"
        icon={<RedeemOutlinedIcon />}
      />

      <SummaryCard
        title="Giới thiệu"
        value={totals.referrals}
        description="Tổng quan hệ referral"
        icon={<ShareOutlinedIcon />}
      />

      <SummaryCard
        title="Voucher người dùng"
        value={totals.userVouchers}
        description="Tổng voucher đã cấp cho người dùng"
        icon={<ConfirmationNumberOutlinedIcon />}
      />

      <SummaryCard
        title="Ví người dùng"
        value={totals.wallets}
        description="Tổng số ví đang tồn tại"
        icon={<AccountBalanceWalletOutlinedIcon />}
      />
    </Box>
  );
}
