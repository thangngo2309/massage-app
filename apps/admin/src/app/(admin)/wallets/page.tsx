"use client";

import {
  Alert,
  Box,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/common";
import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

import { WalletDetailDialog } from "@/components/wallets/WalletDetailDialog";
import { WalletTransactionDetailDialog } from "@/components/wallets/WalletTransactionDetailDialog";

import {
  AdminWalletItem,
  AdminWalletTransactionItem,
  getAdminWallets,
  getAdminWalletTransactions,
  WalletTransactionType,
  WalletType,
} from "@/lib/promotion-operations";

type WalletTab = "wallets" | "transactions";

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

export default function WalletsPage() {
  const [tab, setTab] = useState<WalletTab>("wallets");

  const [walletRows, setWalletRows] = useState<AdminWalletItem[]>([]);
  const [walletTotal, setWalletTotal] = useState(0);

  const [transactionRows, setTransactionRows] = useState<
    AdminWalletTransactionItem[]
  >([]);
  const [transactionTotal, setTransactionTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [walletType, setWalletType] = useState<WalletType | "">("");

  const [transactionType, setTransactionType] = useState<
    WalletTransactionType | ""
  >("");

  const [referenceInput, setReferenceInput] = useState("");
  const [referenceId, setReferenceId] = useState("");

  const [walletPagination, setWalletPagination] = useState<GridPaginationModel>(
    {
      page: 0,
      pageSize: 20,
    }
  );

  const [transactionPagination, setTransactionPagination] =
    useState<GridPaginationModel>({
      page: 0,
      pageSize: 20,
    });

  const [walletDetail, setWalletDetail] = useState<AdminWalletItem | null>(
    null
  );

  const [transactionDetail, setTransactionDetail] =
    useState<AdminWalletTransactionItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setReferenceId(referenceInput.trim());

      setWalletPagination((current) => ({
        ...current,
        page: 0,
      }));

      setTransactionPagination((current) => ({
        ...current,
        page: 0,
      }));
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput, referenceInput]);

  const loadWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminWallets({
        page: walletPagination.page + 1,
        limit: walletPagination.pageSize,
        q: search || undefined,
        walletType,
      });

      setWalletRows(response.items);
      setWalletTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách ví"
      );
    } finally {
      setLoading(false);
    }
  }, [search, walletPagination.page, walletPagination.pageSize, walletType]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminWalletTransactions({
        page: transactionPagination.page + 1,
        limit: transactionPagination.pageSize,
        q: search || undefined,
        walletType,
        type: transactionType,
        referenceId: referenceId || undefined,
      });

      setTransactionRows(response.items);
      setTransactionTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải lịch sử giao dịch ví"
      );
    } finally {
      setLoading(false);
    }
  }, [
    referenceId,
    search,
    transactionPagination.page,
    transactionPagination.pageSize,
    transactionType,
    walletType,
  ]);

  useEffect(() => {
    if (tab === "wallets") {
      void loadWallets();
      return;
    }

    void loadTransactions();
  }, [tab, loadWallets, loadTransactions]);

  const walletColumns = useMemo<GridColDef<AdminWalletItem>[]>(
    () => [
      {
        field: "user",
        headerName: "Người dùng",
        minWidth: 240,
        flex: 1,
        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {params.row.user.fullName} - {params.row.user.phone}
            </Typography>
          </Box>
        ),
      },
      {
        field: "type",
        headerName: "Loại ví",
        minWidth: 150,
        renderCell: (params) => (
          <Chip
            size="small"
            label={getWalletTypeLabel(params.row.type)}
            color={params.row.type === "promotion" ? "secondary" : "primary"}
            variant="outlined"
          />
        ),
      },
      {
        field: "balance",
        headerName: "Số dư",
        minWidth: 180,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {formatCurrency(params.row.balance)}
          </Typography>
        ),
      },
      {
        field: "updatedAt",
        headerName: "Cập nhật",
        minWidth: 170,
        renderCell: (params) => formatDateTime(params.row.updatedAt),
      },
      {
        field: "actions",
        headerName: "",
        width: 70,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: (params) => (
          <Tooltip title="Xem chi tiết">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setWalletDetail(params.row);
              }}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  const transactionColumns = useMemo<GridColDef<AdminWalletTransactionItem>[]>(
    () => [
      {
        field: "user",
        headerName: "Người dùng",
        minWidth: 220,
        flex: 1,
        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {params.row.user.fullName}
            </Typography>

            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.user.phone}
            </Typography>
          </Box>
        ),
      },
      {
        field: "walletType",
        headerName: "Ví",
        minWidth: 140,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <Chip
              size="small"
              variant="outlined"
              label={getWalletTypeLabel(params.row.walletType)}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 0.25,
              }}
            >
              Wallet #{params.row.walletId}
            </Typography>
          </Box>
        ),
      },
      {
        field: "type",
        headerName: "Loại giao dịch",
        minWidth: 170,
        renderCell: (params) => (
          <Chip
            size="small"
            label={getTransactionTypeLabel(params.row.type)}
            color={
              params.row.type === "promotion_reward" ? "success" : "default"
            }
          />
        ),
      },
      {
        field: "amount",
        headerName: "Số tiền",
        minWidth: 160,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const amount = Number(params.row.amount);

          return (
            <Typography
              variant="body2"
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
          );
        },
      },
      {
        field: "referenceId",
        headerName: "Reference",
        minWidth: 180,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: params.row.referenceId ? "monospace" : undefined,
            }}
            noWrap
          >
            {params.row.referenceId ?? "-"}
          </Typography>
        ),
      },
      {
        field: "description",
        headerName: "Mô tả",
        minWidth: 240,
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" noWrap>
            {params.row.description ?? "-"}
          </Typography>
        ),
      },
      {
        field: "createdAt",
        headerName: "Thời gian",
        minWidth: 170,
        renderCell: (params) => formatDateTime(params.row.createdAt),
      },
      {
        field: "actions",
        headerName: "",
        width: 70,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: (params) => (
          <Tooltip title="Xem chi tiết">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setTransactionDetail(params.row);
              }}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Ví & giao dịch"
        description="Theo dõi số dư ví chính, ví khuyến mãi và toàn bộ giao dịch của người dùng."
      />

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        <Tabs
          value={tab}
          onChange={(_event, value) => {
            setTab(value as WalletTab);
            setError("");
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: { xs: 1, sm: 2 } }}
        >
          <Tab value="wallets" label="Số dư ví" />
          <Tab value="transactions" label="Lịch sử giao dịch" />
        </Tabs>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg:
              tab === "transactions"
                ? "2fr repeat(3, minmax(180px, 1fr))"
                : "2fr minmax(220px, 1fr)",
          },
          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          label="Tìm kiếm"
          placeholder="Tên, số điện thoại, email..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <TextField
          select
          size="small"
          label="Loại ví"
          value={walletType}
          onChange={(event) => {
            setWalletType(event.target.value as WalletType | "");

            setWalletPagination((current) => ({
              ...current,
              page: 0,
            }));

            setTransactionPagination((current) => ({
              ...current,
              page: 0,
            }));
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="main">Ví chính</MenuItem>
          <MenuItem value="promotion">Ví khuyến mãi</MenuItem>
        </TextField>

        {tab === "transactions" && (
          <>
            <TextField
              select
              size="small"
              label="Loại giao dịch"
              value={transactionType}
              onChange={(event) => {
                setTransactionType(
                  event.target.value as WalletTransactionType | ""
                );

                setTransactionPagination((current) => ({
                  ...current,
                  page: 0,
                }));
              }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="topup">Nạp tiền</MenuItem>
              <MenuItem value="withdraw">Rút tiền</MenuItem>
              <MenuItem value="payment">Thanh toán</MenuItem>
              <MenuItem value="refund">Hoàn tiền</MenuItem>
              <MenuItem value="adjustment">Điều chỉnh</MenuItem>
              <MenuItem value="promotion_reward">Thưởng khuyến mãi</MenuItem>
            </TextField>

            <TextField
              size="small"
              label="Reference ID"
              placeholder="Booking, promotion..."
              value={referenceInput}
              onChange={(event) => setReferenceInput(event.target.value)}
            />
          </>
        )}
      </Box>

      {tab === "wallets" ? (
        <GenericDataGrid<AdminWalletItem>
          rows={walletRows}
          columns={walletColumns}
          loading={loading}
          rowCount={walletTotal}
          paginationMode="server"
          paginationModel={walletPagination}
          onPaginationModelChange={setWalletPagination}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth={900}
          onRowClick={(params) => setWalletDetail(params.row)}
        />
      ) : (
        <GenericDataGrid<AdminWalletTransactionItem>
          rows={transactionRows}
          columns={transactionColumns}
          loading={loading}
          rowCount={transactionTotal}
          paginationMode="server"
          paginationModel={transactionPagination}
          onPaginationModelChange={setTransactionPagination}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth={1400}
          onRowClick={(params) => setTransactionDetail(params.row)}
        />
      )}

      <WalletDetailDialog
        open={Boolean(walletDetail)}
        item={walletDetail}
        onClose={() => setWalletDetail(null)}
      />

      <WalletTransactionDetailDialog
        open={Boolean(transactionDetail)}
        item={transactionDetail}
        onClose={() => setTransactionDetail(null)}
      />
    </Stack>
  );
}
