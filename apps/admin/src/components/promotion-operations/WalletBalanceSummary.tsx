"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";

import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";

import type { PromotionOperationsWalletBalanceSummary } from "@/lib/promotion-operations-summary";

interface Props {
  data: PromotionOperationsWalletBalanceSummary;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

interface WalletRowProps {
  title: string;
  description: string;
  value: number;
  icon: React.ReactNode;
}

function WalletRow({ title, description, value, icon }: WalletRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
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

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <Typography
        variant="body1"
        sx={{
          fontWeight: 800,
          textAlign: "right",
        }}
      >
        {formatCurrency(value)}
      </Typography>
    </Box>
  );
}

export function WalletBalanceSummary({ data }: Props) {
  const mainBalance = Number(data.main ?? 0);
  const promotionBalance = Number(data.promotion ?? 0);

  const totalBalance = mainBalance + promotionBalance;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Tổng số dư ví
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Tổng balance hiện tại theo từng loại ví.
      </Typography>

      <Stack
        divider={
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          />
        }
        sx={{ mt: 2 }}
      >
        <WalletRow
          title="Ví chính"
          description="MAIN wallet"
          value={mainBalance}
          icon={<AccountBalanceWalletOutlinedIcon />}
        />

        <WalletRow
          title="Ví khuyến mãi"
          description="PROMOTION wallet"
          value={promotionBalance}
          icon={<CardGiftcardOutlinedIcon />}
        />
      </Stack>

      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          Tổng cộng
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {formatCurrency(totalBalance)}
        </Typography>
      </Box>
    </Paper>
  );
}
