"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/common";

import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

import { GrantUserVoucherDialog } from "@/components/user-vouchers/GrantUserVoucherDialog";

import { UserVoucherDetailDialog } from "@/components/user-vouchers/UserVoucherDetailDialog";

import {
  AdminUserVoucherItem,
  getAdminUserVouchers,
  UserVoucherSourceType,
  UserVoucherStatus,
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
  }).format(value);
}

function getStatusLabel(status: UserVoucherStatus) {
  switch (status) {
    case "available":
      return "Khả dụng";

    case "reserved":
      return "Đã giữ";

    case "used":
      return "Đã sử dụng";

    case "expired":
      return "Hết hạn";

    case "cancelled":
      return "Đã hủy";

    default:
      return status;
  }
}

function getStatusColor(
  status: UserVoucherStatus
): "success" | "warning" | "info" | "default" {
  switch (status) {
    case "available":
      return "success";

    case "reserved":
      return "warning";

    case "used":
      return "info";

    default:
      return "default";
  }
}

function getSourceLabel(sourceType: UserVoucherSourceType) {
  switch (sourceType) {
    case "promotion":
      return "Khuyến mãi";

    case "referral":
      return "Giới thiệu";

    case "first_booking":
      return "Booking đầu tiên";

    case "admin":
      return "Admin cấp";

    default:
      return sourceType;
  }
}

export default function UserVouchersPage() {
  const [rows, setRows] = useState<AdminUserVoucherItem[]>([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<UserVoucherStatus | "">("");

  const [sourceType, setSourceType] = useState<UserVoucherSourceType | "">("");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [grantOpen, setGrantOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<AdminUserVoucherItem | null>(
    null
  );

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

      const response = await getAdminUserVouchers({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: search,
        status,
        sourceType,
      });

      setRows(response.items);
      setTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách User Voucher"
      );
    } finally {
      setLoading(false);
    }
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    search,
    sourceType,
    status,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openDetail = (item: AdminUserVoucherItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const columns = useMemo<GridColDef<AdminUserVoucherItem>[]>(
    () => [
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
        field: "voucher",
        headerName: "Voucher",
        minWidth: 180,
        flex: 0.8,

        renderCell: (params) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {params.row.voucher.code}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {params.row.voucher.discountType === "fixed"
                ? formatCurrency(params.row.voucher.discountValue)
                : `${params.row.voucher.discountValue}%`}
            </Typography>
          </Box>
        ),
      },

      {
        field: "status",
        headerName: "Trạng thái",
        minWidth: 120,

        renderCell: (params) => (
          <Chip
            size="small"
            label={getStatusLabel(params.row.status)}
            color={getStatusColor(params.row.status)}
            variant={
              params.row.status === "expired" ||
              params.row.status === "cancelled"
                ? "outlined"
                : "filled"
            }
          />
        ),
      },

      {
        field: "sourceType",
        headerName: "Nguồn cấp",
        minWidth: 140,

        renderCell: (params) => (
          <Chip
            size="small"
            variant="outlined"
            label={getSourceLabel(params.row.sourceType)}
          />
        ),
      },

      {
        field: "booking",
        headerName: "Booking",
        minWidth: 130,
        sortable: false,

        renderCell: (params) => {
          if (params.row.usedBookingId) {
            return (
              <Typography variant="body2">
                #{params.row.usedBookingId}
              </Typography>
            );
          }

          if (params.row.reservedBookingId) {
            return (
              <Typography variant="body2">
                #{params.row.reservedBookingId}
              </Typography>
            );
          }

          return "-";
        },
      },

      {
        field: "expiresAt",
        headerName: "Hết hạn",
        minWidth: 160,

        renderCell: (params) => formatDateTime(params.row.expiresAt),
      },

      {
        field: "createdAt",
        headerName: "Ngày cấp",
        minWidth: 160,

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

                openDetail(params.row);
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
        title="Voucher người dùng"
        description="Theo dõi voucher đã được cấp, nguồn phát hành và trạng thái sử dụng."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGrantOpen(true)}
          >
            Cấp voucher
          </Button>
        }
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
            lg: "2fr repeat(2, minmax(180px, 1fr))",
          },

          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          label="Tìm kiếm"
          placeholder="Voucher, tên, SĐT, reference..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <TextField
          select
          size="small"
          label="Trạng thái"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as UserVoucherStatus | "");

            setPaginationModel((current) => ({
              ...current,
              page: 0,
            }));
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>

          <MenuItem value="available">Khả dụng</MenuItem>

          <MenuItem value="reserved">Đã giữ</MenuItem>

          <MenuItem value="used">Đã sử dụng</MenuItem>

          <MenuItem value="expired">Hết hạn</MenuItem>

          <MenuItem value="cancelled">Đã hủy</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Nguồn cấp"
          value={sourceType}
          onChange={(event) => {
            setSourceType(event.target.value as UserVoucherSourceType | "");

            setPaginationModel((current) => ({
              ...current,
              page: 0,
            }));
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>

          <MenuItem value="promotion">Khuyến mãi</MenuItem>

          <MenuItem value="referral">Giới thiệu</MenuItem>

          <MenuItem value="first_booking">Booking đầu tiên</MenuItem>

          <MenuItem value="admin">Admin cấp</MenuItem>
        </TextField>
      </Box>

      <GenericDataGrid<AdminUserVoucherItem>
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={total}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50, 100]}
        minWidth={1250}
        onRowClick={(params) => openDetail(params.row)}
      />

      <GrantUserVoucherDialog
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        onSuccess={() => {
          void loadData();
        }}
      />

      <UserVoucherDetailDialog
        open={detailOpen}
        item={selectedItem}
        onClose={() => {
          setDetailOpen(false);
          setSelectedItem(null);
        }}
        onChanged={() => {
          void loadData();
        }}
      />
    </Stack>
  );
}
