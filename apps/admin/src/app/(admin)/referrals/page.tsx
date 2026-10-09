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

import { ReferralDetailDialog } from "@/components/referrals/ReferralDetailDialog";

import {
  AdminReferralCodeItem,
  AdminReferralItem,
  getAdminReferralCodes,
  getAdminReferrals,
  ReferralStatus,
} from "@/lib/promotion-operations";

type ReferralTab = "referrals" | "codes";

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

function getRoleLabel(role: string) {
  switch (role) {
    case "client":
      return "Khách hàng";

    case "therapist":
      return "Kỹ thuật viên";

    case "super_admin":
      return "Super Admin";

    case "system_admin":
      return "System Admin";

    default:
      return role;
  }
}

function getStatusLabel(status: ReferralStatus) {
  switch (status) {
    case "pending":
      return "Đang chờ";

    case "qualified":
      return "Đủ điều kiện";

    case "rewarded":
      return "Đã phát thưởng";

    case "invalid":
      return "Không hợp lệ";

    default:
      return status;
  }
}

function getStatusColor(
  status: ReferralStatus
): "warning" | "info" | "success" | "error" | "default" {
  switch (status) {
    case "pending":
      return "warning";

    case "qualified":
      return "info";

    case "rewarded":
      return "success";

    case "invalid":
      return "error";

    default:
      return "default";
  }
}

export default function ReferralsPage() {
  const [tab, setTab] = useState<ReferralTab>("referrals");

  const [referralRows, setReferralRows] = useState<AdminReferralItem[]>([]);

  const [referralTotal, setReferralTotal] = useState(0);

  const [codeRows, setCodeRows] = useState<AdminReferralCodeItem[]>([]);

  const [codeTotal, setCodeTotal] = useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<ReferralStatus | "">("");

  const [codeActive, setCodeActive] = useState<"" | "true" | "false">("");

  const [referralPaginationModel, setReferralPaginationModel] =
    useState<GridPaginationModel>({
      page: 0,

      pageSize: 20,
    });

  const [codePaginationModel, setCodePaginationModel] =
    useState<GridPaginationModel>({
      page: 0,

      pageSize: 20,
    });

  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedReferral, setSelectedReferral] =
    useState<AdminReferralItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());

      setReferralPaginationModel((current) => ({
        ...current,

        page: 0,
      }));

      setCodePaginationModel((current) => ({
        ...current,

        page: 0,
      }));
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const loadReferrals = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const response = await getAdminReferrals({
        page: referralPaginationModel.page + 1,

        limit: referralPaginationModel.pageSize,

        q: search || undefined,

        status,
      });

      setReferralRows(response.items ?? []);

      setReferralTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách giới thiệu"
      );
    } finally {
      setLoading(false);
    }
  }, [
    referralPaginationModel.page,

    referralPaginationModel.pageSize,

    search,

    status,
  ]);

  const loadReferralCodes = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const response = await getAdminReferralCodes({
        page: codePaginationModel.page + 1,

        limit: codePaginationModel.pageSize,

        q: search || undefined,

        isActive: codeActive === "" ? "" : codeActive === "true",
      });

      setCodeRows(response.items ?? []);

      setCodeTotal(response.pagination.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh sách mã giới thiệu"
      );
    } finally {
      setLoading(false);
    }
  }, [
    codeActive,

    codePaginationModel.page,

    codePaginationModel.pageSize,

    search,
  ]);

  useEffect(() => {
    if (tab === "referrals") {
      void loadReferrals();

      return;
    }

    void loadReferralCodes();
  }, [tab, loadReferrals, loadReferralCodes]);

  const openReferralDetail = (item: AdminReferralItem) => {
    setSelectedReferral(item);

    setDetailOpen(true);
  };

  const referralColumns = useMemo<GridColDef<AdminReferralItem>[]>(
    () => [
      {
        field: "referrer",

        headerName: "Người giới thiệu",

        minWidth: 220,

        flex: 1,

        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {params.row.referrer?.fullName ?? "-"}
            </Typography>

            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.referrer?.phone ?? "-"}
            </Typography>
          </Box>
        ),
      },

      {
        field: "referredUser",

        headerName: "Người được giới thiệu",

        minWidth: 220,

        flex: 1,

        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {params.row.referredUser?.fullName ?? "-"}
            </Typography>

            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.referredUser?.phone ?? "-"}
            </Typography>
          </Box>
        ),
      },

      {
        field: "referralCodeSnapshot",

        headerName: "Mã giới thiệu",

        minWidth: 150,

        renderCell: (params) => (
          <Chip
            size="small"
            variant="outlined"
            label={params.row.referralCodeSnapshot || "-"}
          />
        ),
      },

      {
        field: "status",

        headerName: "Trạng thái",

        minWidth: 150,

        renderCell: (params) => (
          <Chip
            size="small"
            label={getStatusLabel(params.row.status)}
            color={getStatusColor(params.row.status)}
          />
        ),
      },

      {
        field: "qualifiedAt",

        headerName: "Đủ điều kiện",

        minWidth: 165,

        renderCell: (params) => formatDateTime(params.row.qualifiedAt),
      },

      {
        field: "rewardedAt",

        headerName: "Phát thưởng",

        minWidth: 165,

        renderCell: (params) => formatDateTime(params.row.rewardedAt),
      },

      {
        field: "createdAt",

        headerName: "Ngày tạo",

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

                openReferralDetail(params.row);
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

  const codeColumns = useMemo<GridColDef<AdminReferralCodeItem>[]>(
    () => [
      {
        field: "code",

        headerName: "Mã giới thiệu",

        minWidth: 180,

        renderCell: (params) => (
          <Chip size="small" label={params.row.code} variant="outlined" />
        ),
      },

      {
        field: "user",

        headerName: "Chủ sở hữu",

        minWidth: 240,

        flex: 1,

        renderCell: (params) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {params.row.user?.fullName ?? "-"}
            </Typography>

            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.user?.phone ?? "-"}
            </Typography>
          </Box>
        ),
      },

      {
        field: "role",

        headerName: "Vai trò",

        minWidth: 140,

        renderCell: (params) =>
          params.row.user?.role ? getRoleLabel(params.row.user.role) : "-",
      },

      {
        field: "isActive",

        headerName: "Trạng thái",

        minWidth: 130,

        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.isActive ? "Hoạt động" : "Ngừng hoạt động"}
            color={params.row.isActive ? "success" : "default"}
            variant={params.row.isActive ? "filled" : "outlined"}
          />
        ),
      },

      {
        field: "createdAt",

        headerName: "Ngày tạo",

        minWidth: 165,

        renderCell: (params) => formatDateTime(params.row.createdAt),
      },
    ],

    []
  );

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Giới thiệu"
        description="Theo dõi mã giới thiệu và quá trình người dùng được giới thiệu đủ điều kiện nhận thưởng."
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
            setTab(value as ReferralTab);

            setError("");
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: {
              xs: 1,

              sm: 2,
            },
          }}
        >
          <Tab value="referrals" label="Quan hệ giới thiệu" />

          <Tab value="codes" label="Mã giới thiệu" />
        </Tabs>
      </Paper>

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            sm: "repeat(2, minmax(0, 1fr))",

            lg: "2fr minmax(220px, 1fr)",
          },

          gap: 1.5,
        }}
      >
        <TextField
          size="small"
          label="Tìm kiếm"
          placeholder={
            tab === "referrals"
              ? "Tên, SĐT, email, mã giới thiệu..."
              : "Tên, SĐT, email, mã giới thiệu..."
          }
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        {tab === "referrals" ? (
          <TextField
            select
            size="small"
            label="Trạng thái"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ReferralStatus | "");

              setReferralPaginationModel((current) => ({
                ...current,

                page: 0,
              }));
            }}
          >
            <MenuItem value="">Tất cả</MenuItem>

            <MenuItem value="pending">Đang chờ</MenuItem>

            <MenuItem value="qualified">Đủ điều kiện</MenuItem>

            <MenuItem value="rewarded">Đã phát thưởng</MenuItem>

            <MenuItem value="invalid">Không hợp lệ</MenuItem>
          </TextField>
        ) : (
          <TextField
            select
            size="small"
            label="Trạng thái mã"
            value={codeActive}
            onChange={(event) => {
              setCodeActive(event.target.value as "" | "true" | "false");

              setCodePaginationModel((current) => ({
                ...current,

                page: 0,
              }));
            }}
          >
            <MenuItem value="">Tất cả</MenuItem>

            <MenuItem value="true">Hoạt động</MenuItem>

            <MenuItem value="false">Ngừng hoạt động</MenuItem>
          </TextField>
        )}
      </Box>

      {tab === "referrals" ? (
        <GenericDataGrid<AdminReferralItem>
          rows={referralRows}
          columns={referralColumns}
          loading={loading}
          rowCount={referralTotal}
          paginationMode="server"
          paginationModel={referralPaginationModel}
          onPaginationModelChange={setReferralPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth={1350}
          onRowClick={(params) => openReferralDetail(params.row)}
        />
      ) : (
        <GenericDataGrid<AdminReferralCodeItem>
          rows={codeRows}
          columns={codeColumns}
          loading={loading}
          rowCount={codeTotal}
          paginationMode="server"
          paginationModel={codePaginationModel}
          onPaginationModelChange={setCodePaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth={900}
        />
      )}

      <ReferralDetailDialog
        open={detailOpen}
        item={selectedReferral}
        onClose={() => {
          setDetailOpen(false);

          setSelectedReferral(null);
        }}
      />
    </Stack>
  );
}
