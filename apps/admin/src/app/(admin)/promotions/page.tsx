"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

import {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";

import { useCallback, useEffect, useMemo, useState } from "react";

import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

import { PageHeader } from "@/components/common";

import { PromotionDialog } from "@/components/promotions/PromotionDialog";

import {
  getPromotion,
  getPromotions,
  PromotionAudience,
  PromotionItem,
  PromotionRewardType,
  PromotionTriggerType,
  updatePromotionActive,
} from "@/lib/promotions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",

    currency: "VND",

    maximumFractionDigits: 0,
  }).format(value);
}

function getTranslationName(item: PromotionItem) {
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

function getAudienceLabel(value: PromotionAudience) {
  switch (value) {
    case "client":
      return "Khách hàng";

    case "therapist":
      return "Kỹ thuật viên";

    default:
      return value;
  }
}

function getTriggerLabel(value: PromotionTriggerType) {
  switch (value) {
    case "referral_code_entered":
      return "Nhập mã giới thiệu";

    case "referral_qualified":
      return "Giới thiệu đạt điều kiện";

    case "first_booking_eligible":
      return "Đủ điều kiện booking đầu";

    case "first_booking_completed":
      return "Hoàn thành booking đầu";

    default:
      return value;
  }
}

function getRewardTypeLabel(value: PromotionRewardType) {
  switch (value) {
    case "wallet_credit":
      return "Cộng ví";

    case "voucher":
      return "Voucher";

    default:
      return value;
  }
}

export default function PromotionsPage() {
  const [rows, setRows] = useState<PromotionItem[]>([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [audience, setAudience] = useState<PromotionAudience | "">("");

  const [triggerType, setTriggerType] = useState<PromotionTriggerType | "">("");

  const [rewardType, setRewardType] = useState<PromotionRewardType | "">("");

  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,

    pageSize: 20,
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionItem | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);

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

      const response = await getPromotions({
        page: paginationModel.page + 1,

        limit: paginationModel.pageSize,

        q: search,

        audience,

        triggerType,

        rewardType,

        isActive:
          activeFilter === "all" ? undefined : activeFilter === "active",
      });

      setRows(response.items);

      setTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách khuyến mãi"
      );
    } finally {
      setLoading(false);
    }
  }, [
    activeFilter,
    audience,
    paginationModel.page,
    paginationModel.pageSize,
    rewardType,
    search,
    triggerType,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setSelectedPromotion(null);

    setDialogMode("create");

    setDialogOpen(true);
  };

  const openEdit = async (item: PromotionItem) => {
    try {
      setDetailLoading(true);

      setError("");

      const detail = await getPromotion(item.id);

      setSelectedPromotion(detail);

      setDialogMode("edit");

      setDialogOpen(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải thông tin chương trình"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const changeActive = async (item: PromotionItem, checked: boolean) => {
    try {
      setChangingActiveId(item.id);

      setError("");

      await updatePromotionActive(item.id, checked);

      await loadData();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Không thể cập nhật trạng thái"
      );
    } finally {
      setChangingActiveId(null);
    }
  };

  const columns = useMemo<GridColDef<PromotionItem>[]>(
    () => [
      {
        field: "code",

        headerName: "Mã",

        minWidth: 180,

        flex: 0.8,

        renderCell: (params) => (
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
              }}
              noWrap
            >
              {params.row.code}
            </Typography>

            <Typography variant="caption" color="text.secondary" noWrap>
              #{params.row.id}
            </Typography>
          </Box>
        ),
      },

      {
        field: "name",

        headerName: "Tên chương trình",

        minWidth: 220,

        flex: 1.1,

        sortable: false,

        valueGetter: (_value, row) => getTranslationName(row),
      },

      {
        field: "audience",

        headerName: "Đối tượng",

        minWidth: 130,

        flex: 0.6,

        renderCell: (
          params: GridRenderCellParams<PromotionItem, PromotionAudience>
        ) => (
          <Chip
            size="small"
            label={getAudienceLabel(params.row.audience)}
            variant="outlined"
          />
        ),
      },

      {
        field: "triggerType",

        headerName: "Điều kiện",

        minWidth: 210,

        flex: 1,

        renderCell: (params) => (
          <Typography variant="body2">
            {getTriggerLabel(params.row.triggerType)}
          </Typography>
        ),
      },

      {
        field: "rewardType",

        headerName: "Phần thưởng",

        minWidth: 160,

        flex: 0.8,

        renderCell: (params) => (
          <Box>
            <Chip
              size="small"
              label={getRewardTypeLabel(params.row.rewardType)}
              color={
                params.row.rewardType === "wallet_credit"
                  ? "success"
                  : "primary"
              }
              variant="outlined"
            />

            {params.row.rewardType === "wallet_credit" && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",

                  mt: 0.3,
                }}
              >
                {formatCurrency(params.row.rewardValue)}
              </Typography>
            )}
          </Box>
        ),
      },

      {
        field: "usageLimitPerUser",

        headerName: "Mỗi user",

        width: 100,

        align: "center",

        headerAlign: "center",

        renderCell: (params) => params.row.usageLimitPerUser ?? "∞",
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
            onClick={(event) => {
              event.stopPropagation();
            }}
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
              disabled={detailLoading}
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
    [changingActiveId, detailLoading]
  );

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Khuyến mãi"
        description="Quản lý chương trình giới thiệu, ưu đãi booking đầu tiên và phần thưởng ví."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            Thêm chương trình
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

            lg: "2fr repeat(4, minmax(150px, 1fr))",
          },

          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          label="Tìm kiếm"
          placeholder="Mã hoặc tên chương trình..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <TextField
          select
          size="small"
          label="Đối tượng"
          value={audience}
          onChange={(event) => {
            setAudience(event.target.value as PromotionAudience | "");

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
          label="Điều kiện"
          value={triggerType}
          onChange={(event) => {
            setTriggerType(event.target.value as PromotionTriggerType | "");

            setPaginationModel((current) => ({
              ...current,

              page: 0,
            }));
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>

          <MenuItem value="referral_code_entered">Nhập mã giới thiệu</MenuItem>

          <MenuItem value="referral_qualified">
            Giới thiệu đạt điều kiện
          </MenuItem>

          <MenuItem value="first_booking_eligible">
            Đủ điều kiện booking đầu
          </MenuItem>

          <MenuItem value="first_booking_completed">
            Hoàn thành booking đầu
          </MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Phần thưởng"
          value={rewardType}
          onChange={(event) => {
            setRewardType(event.target.value as PromotionRewardType | "");

            setPaginationModel((current) => ({
              ...current,

              page: 0,
            }));
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>

          <MenuItem value="wallet_credit">Cộng ví</MenuItem>

          <MenuItem value="voucher">Voucher</MenuItem>
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

      <Box
        sx={{
          position: "relative",
        }}
      >
        {detailLoading && (
          <Box
            sx={{
              position: "absolute",

              inset: 0,

              zIndex: 2,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              bgcolor: "rgba(255,255,255,0.5)",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        <GenericDataGrid<PromotionItem>
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
      </Box>

      <PromotionDialog
        open={dialogOpen}
        mode={dialogMode}
        promotion={selectedPromotion}
        onClose={() => {
          setDialogOpen(false);

          setSelectedPromotion(null);
        }}
        onSuccess={() => {
          void loadData();
        }}
      />
    </Stack>
  );
}
