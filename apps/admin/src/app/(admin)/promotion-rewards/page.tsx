"use client";

import {
  Alert,
  Box,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/common";

import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

import { PromotionRewardDetailDialog } from "@/components/promotion-rewards/PromotionRewardDetailDialog";

import {
  AdminPromotionUsageItem,
  getAdminPromotionUsages,
} from "@/lib/promotion-operations";

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

function parsePositiveInteger(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export default function PromotionRewardsPage() {
  const [rows, setRows] = useState<AdminPromotionUsageItem[]>([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [promotionIdInput, setPromotionIdInput] = useState("");

  const [userIdInput, setUserIdInput] = useState("");

  const [bookingIdInput, setBookingIdInput] = useState("");

  const [referralIdInput, setReferralIdInput] = useState("");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [selectedItem, setSelectedItem] =
    useState<AdminPromotionUsageItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());

      setPaginationModel((current) => ({
        ...current,
        page: 0,
      }));
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminPromotionUsages({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,

        q: search || undefined,

        promotionId: parsePositiveInteger(promotionIdInput),

        userId: parsePositiveInteger(userIdInput),

        bookingId: parsePositiveInteger(bookingIdInput),

        referralId: parsePositiveInteger(referralIdInput),
      });

      setRows(response.items);
      setTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải lịch sử phát thưởng"
      );
    } finally {
      setLoading(false);
    }
  }, [
    bookingIdInput,
    paginationModel.page,
    paginationModel.pageSize,
    promotionIdInput,
    referralIdInput,
    search,
    userIdInput,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadData]);

  const resetPage = () => {
    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));
  };

  const columns = useMemo<GridColDef<AdminPromotionUsageItem>[]>(
    () => [
      {
        field: "promotionCode",
        headerName: "Khuyến mãi",
        minWidth: 180,

        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {params.row.promotionCode}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              #{params.row.promotionId}
            </Typography>
          </Box>
        ),
      },

      {
        field: "user",
        headerName: "Người nhận",
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
        field: "rewardAmount",
        headerName: "Giá trị reward",
        minWidth: 160,
        align: "right",
        headerAlign: "right",

        renderCell: (params) => {
          const amount = Number(params.row.rewardAmount);

          return (
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {amount !== 0 ? formatCurrency(amount) : "-"}
            </Typography>
          );
        },
      },

      {
        field: "bookingId",
        headerName: "Booking",
        minWidth: 150,

        renderCell: (params) => (
          <Box>
            <Typography variant="body2">
              {params.row.bookingId ? `#${params.row.bookingId}` : "-"}
            </Typography>

            {params.row.bookingCode && (
              <Typography variant="caption" color="text.secondary">
                {params.row.bookingCode}
              </Typography>
            )}
          </Box>
        ),
      },

      {
        field: "referralId",
        headerName: "Referral",
        minWidth: 110,

        renderCell: (params) =>
          params.row.referralId ? `#${params.row.referralId}` : "-",
      },

      {
        field: "uniqueKey",
        headerName: "Unique Key",
        minWidth: 260,
        flex: 1,

        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontFamily: "monospace" }} noWrap>
            {params.row.uniqueKey}
          </Typography>
        ),
      },

      {
        field: "createdAt",
        headerName: "Thời gian",
        minWidth: 165,

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

                setSelectedItem(params.row);
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
        title="Lịch sử phát thưởng"
        description="Theo dõi các lần Promotion Engine đã thực thi và cấp phần thưởng cho người dùng."
      />

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "2fr repeat(4, minmax(130px, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          label="Tìm kiếm"
          placeholder="Mã promotion, tên, SĐT, email..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <TextField
          size="small"
          label="Promotion ID"
          type="number"
          value={promotionIdInput}
          onChange={(event) => {
            setPromotionIdInput(event.target.value);
            resetPage();
          }}
          slotProps={{
            htmlInput: {
              min: 1,
            },
          }}
        />

        <TextField
          size="small"
          label="User ID"
          type="number"
          value={userIdInput}
          onChange={(event) => {
            setUserIdInput(event.target.value);
            resetPage();
          }}
          slotProps={{
            htmlInput: {
              min: 1,
            },
          }}
        />

        <TextField
          size="small"
          label="Booking ID"
          type="number"
          value={bookingIdInput}
          onChange={(event) => {
            setBookingIdInput(event.target.value);
            resetPage();
          }}
          slotProps={{
            htmlInput: {
              min: 1,
            },
          }}
        />

        <TextField
          size="small"
          label="Referral ID"
          type="number"
          value={referralIdInput}
          onChange={(event) => {
            setReferralIdInput(event.target.value);
            resetPage();
          }}
          slotProps={{
            htmlInput: {
              min: 1,
            },
          }}
        />
      </Box>

      <GenericDataGrid<AdminPromotionUsageItem>
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={total}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50, 100]}
        minWidth={1350}
        onRowClick={(params) => setSelectedItem(params.row)}
      />

      <PromotionRewardDetailDialog
        open={Boolean(selectedItem)}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </Stack>
  );
}
