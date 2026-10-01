"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/common";

import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

import { VoucherDialog } from "@/components/vouchers/VoucherDialog";

import {
  getVoucher,
  getVouchers,
  updateVoucherActive,
  VoucherAudience,
  VoucherDiscountType,
  VoucherItem,
} from "@/lib/vouchers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTranslationName(item: VoucherItem) {
  const translation =
    item.translations.find(
      (translation) => translation.locale.toLowerCase() === "vi"
    ) ??
    item.translations.find((translation) =>
      translation.locale.toLowerCase().startsWith("vi")
    ) ??
    item.translations[0];

  return translation?.name ?? "-";
}

function getAudienceLabel(value: VoucherAudience) {
  switch (value) {
    case "client":
      return "Khách hàng";

    case "therapist":
      return "Kỹ thuật viên";

    default:
      return value;
  }
}

function getDiscountLabel(item: VoucherItem) {
  if (item.discountType === "fixed") {
    return formatCurrency(item.discountValue);
  }

  const percent = `${item.discountValue}%`;

  if (item.maxDiscountAmount === null) {
    return percent;
  }

  return `${percent} · tối đa ${formatCurrency(item.maxDiscountAmount)}`;
}

export default function VouchersPage() {
  const [rows, setRows] = useState<VoucherItem[]>([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [audience, setAudience] = useState<VoucherAudience | "">("");

  const [discountType, setDiscountType] = useState<VoucherDiscountType | "">(
    ""
  );

  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(
    null
  );

  const [changingActiveId, setChangingActiveId] = useState<number | null>(null);

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

      const response = await getVouchers({
        page: paginationModel.page + 1,

        limit: paginationModel.pageSize,

        q: search,

        audience,

        discountType,

        isActive:
          activeFilter === "all" ? undefined : activeFilter === "active",
      });

      setRows(response.items);

      setTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách voucher"
      );
    } finally {
      setLoading(false);
    }
  }, [
    activeFilter,
    audience,
    discountType,
    paginationModel.page,
    paginationModel.pageSize,
    search,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setSelectedVoucher(null);

    setDialogMode("create");

    setDialogOpen(true);
  };

  const openEdit = async (item: VoucherItem) => {
    try {
      setError("");

      const detail = await getVoucher(item.id);

      setSelectedVoucher(detail);

      setDialogMode("edit");

      setDialogOpen(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải thông tin voucher"
      );
    }
  };

  const changeActive = async (item: VoucherItem, checked: boolean) => {
    try {
      setChangingActiveId(item.id);

      setError("");

      await updateVoucherActive(item.id, checked);

      await loadData();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Không thể cập nhật trạng thái voucher"
      );
    } finally {
      setChangingActiveId(null);
    }
  };

  const columns = useMemo<GridColDef<VoucherItem>[]>(
    () => [
      {
        field: "code",
        headerName: "Mã voucher",
        minWidth: 180,
        flex: 0.8,

        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              #{params.row.id} {params.row.code}
            </Typography>
          </Box>
        ),
      },

      {
        field: "name",
        headerName: "Tên voucher",
        minWidth: 220,
        flex: 1,
        sortable: false,

        valueGetter: (_value, row) => getTranslationName(row),
      },

      {
        field: "audience",
        headerName: "Đối tượng",
        minWidth: 130,
        flex: 0.6,

        renderCell: (params) => (
          <Chip
            size="small"
            label={getAudienceLabel(params.row.audience)}
            variant="outlined"
          />
        ),
      },

      {
        field: "discount",
        headerName: "Mức giảm",
        minWidth: 220,
        flex: 1,
        sortable: false,

        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {getDiscountLabel(params.row)}
          </Typography>
        ),
      },

      {
        field: "minOrderAmount",
        headerName: "Booking tối thiểu",
        minWidth: 150,
        flex: 0.7,

        renderCell: (params) =>
          params.row.minOrderAmount > 0
            ? formatCurrency(params.row.minOrderAmount)
            : "Không yêu cầu",
      },

      {
        field: "issuanceLimit",
        headerName: "Giới hạn cấp",
        width: 120,
        align: "center",
        headerAlign: "center",

        renderCell: (params) => params.row.issuanceLimit ?? "∞",
      },

      {
        field: "isActive",
        headerName: "Hoạt động",
        width: 110,
        align: "center",
        headerAlign: "center",

        renderCell: (params) => (
          <Switch
            size="small"
            checked={params.row.isActive}
            disabled={changingActiveId === params.row.id}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              void changeActive(params.row, event.target.checked);
            }}
          />
        ),
      },

      {
        field: "actions",
        headerName: "",
        width: 70,
        sortable: false,
        filterable: false,
        align: "center",

        renderCell: (params) => (
          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();

                void openEdit(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [changingActiveId]
  );

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Voucher"
        description="Quản lý voucher được cấp cho khách hàng và kỹ thuật viên."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            Thêm voucher
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
            lg: "2fr repeat(3, minmax(160px, 1fr))",
          },

          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          label="Tìm kiếm"
          placeholder="Mã hoặc tên voucher..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <TextField
          select
          size="small"
          label="Đối tượng"
          value={audience}
          onChange={(event) => {
            setAudience(event.target.value as VoucherAudience | "");

            setPaginationModel((current) => ({
              ...current,
              page: 0,
            }));
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>

          <MenuItem value="client">Khách hàng</MenuItem>

          <MenuItem value="therapist">Kỹ thuật viên</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Loại giảm"
          value={discountType}
          onChange={(event) => {
            setDiscountType(event.target.value as VoucherDiscountType | "");

            setPaginationModel((current) => ({
              ...current,
              page: 0,
            }));
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>

          <MenuItem value="fixed">Số tiền cố định</MenuItem>

          <MenuItem value="percent">Phần trăm</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Trạng thái"
          value={activeFilter}
          onChange={(event) => {
            setActiveFilter(
              event.target.value as "all" | "active" | "inactive"
            );

            setPaginationModel((current) => ({
              ...current,
              page: 0,
            }));
          }}
        >
          <MenuItem value="all">Tất cả</MenuItem>

          <MenuItem value="active">Đang hoạt động</MenuItem>

          <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
        </TextField>
      </Box>

      <GenericDataGrid<VoucherItem>
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={total}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50, 100]}
        minWidth={1250}
      />

      <VoucherDialog
        open={dialogOpen}
        mode={dialogMode}
        voucher={selectedVoucher}
        onClose={() => {
          setDialogOpen(false);

          setSelectedVoucher(null);
        }}
        onSuccess={() => {
          void loadData();
        }}
      />
    </Stack>
  );
}
