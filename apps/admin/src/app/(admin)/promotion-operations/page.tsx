"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

import Link from "next/link";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/common";

import { PromotionOperationsSummaryCards } from "@/components/promotion-operations/PromotionOperationsSummaryCards";
import { ReferralStatusSummary } from "@/components/promotion-operations/ReferralStatusSummary";
import { VoucherStatusSummary } from "@/components/promotion-operations/VoucherStatusSummary";
import { WalletBalanceSummary } from "@/components/promotion-operations/WalletBalanceSummary";

import {
  AdminPromotionOperationsSummary,
  getAdminPromotionOperationsSummary,
} from "@/lib/promotion-operations-summary";

interface ShortcutProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function Shortcut({ href, title, description, icon }: ShortcutProps) {
  return (
    <Paper
      component={Link}
      href={href}
      variant="outlined"
      sx={{
        p: 2,
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-2px)",
          boxShadow: 2,
        },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function PromotionOperationsPage() {
  const [summary, setSummary] =
    useState<AdminPromotionOperationsSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminPromotionOperationsSummary();

      setSummary(response);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải dữ liệu tổng quan"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Promotion Operations"
        description="Tổng quan hoạt động khuyến mãi, voucher, referral và ví người dùng."
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={loading}
            onClick={() => void loadData()}
          >
            Làm mới
          </Button>
        }
      />

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading && !summary ? (
        <Paper
          variant="outlined"
          sx={{
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Paper>
      ) : summary ? (
        <>
          <PromotionOperationsSummaryCards totals={summary.totals} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <VoucherStatusSummary data={summary.userVouchersByStatus} />

            <ReferralStatusSummary data={summary.referralsByStatus} />

            <WalletBalanceSummary data={summary.walletBalanceByType} />
          </Box>

          <Box>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 700,
              }}
            >
              Truy cập nhanh
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(5, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Shortcut
                href="/promotions"
                title="Khuyến mãi"
                description="Cấu hình Promotion Engine"
                icon={<LocalOfferOutlinedIcon />}
              />

              <Shortcut
                href="/user-vouchers"
                title="Voucher người dùng"
                description="Theo dõi voucher đã cấp"
                icon={<ConfirmationNumberOutlinedIcon />}
              />

              <Shortcut
                href="/referrals"
                title="Giới thiệu"
                description="Referral và mã giới thiệu"
                icon={<ShareOutlinedIcon />}
              />

              <Shortcut
                href="/promotion-rewards"
                title="Lịch sử phát thưởng"
                description="Promotion Usage"
                icon={<RedeemOutlinedIcon />}
              />

              <Shortcut
                href="/wallets"
                title="Ví & giao dịch"
                description="Balance và transaction"
                icon={<AccountBalanceWalletOutlinedIcon />}
              />
            </Box>
          </Box>
        </>
      ) : (
        <Alert severity="info">Chưa có dữ liệu tổng quan.</Alert>
      )}
    </Stack>
  );
}
