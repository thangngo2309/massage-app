"use client";

import {
  Alert,
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common";

import {
  getTherapists,
  OnlineStatus,
  TherapistListItem,
  VerificationStatus,
} from "@/lib/therapists";
import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";
import { TherapistDetailDialog } from "@/components/therapists/TherapistDetailDialog";

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "Chờ xác minh",
  verified: "Đã xác minh",
  rejected: "Từ chối",
};

const ONLINE_LABELS: Record<OnlineStatus, string> = {
  offline: "Offline",
  online: "Online",
  busy: "Đang bận",
};

export default function TherapistsPage() {
  const [rows, setRows] = useState<TherapistListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    VerificationStatus | ""
  >("");

  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus | "">("");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [rowCount, setRowCount] = useState(0);

  const [selectedTherapist, setSelectedTherapist] =
    useState<TherapistListItem | null>(null);

  const [acceptingBookings, setAcceptingBookings] = useState<
    "" | "true" | "false"
  >("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPaginationModel((prev) => ({
        ...prev,
        page: 0,
      }));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getTherapists({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: debouncedSearch,
        verificationStatus,
        onlineStatus,
        isAcceptingBookings:
          acceptingBookings === "" ? undefined : acceptingBookings === "true",
      });

      setRows(response.items);

      setRowCount(response.pagination.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách kỹ thuật viên"
      );
    } finally {
      setLoading(false);
    }
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearch,
    verificationStatus,
    onlineStatus,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns = useMemo<GridColDef<TherapistListItem>[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 70,
      },
      {
        field: "fullName",
        headerName: "Họ tên",
        flex: 1,
        minWidth: 190,
      },
      {
        field: "phone",
        headerName: "Điện thoại",
        width: 165,
      },
      {
        field: "verificationStatus",
        headerName: "Xác minh",
        width: 150,
        renderCell: (params) => {
          const value = params.row.verificationStatus;

          return (
            <Chip
              size="small"
              color={
                value === "verified"
                  ? "success"
                  : value === "rejected"
                  ? "error"
                  : "warning"
              }
              label={VERIFICATION_LABELS[value]}
            />
          );
        },
      },
      {
        field: "onlineStatus",
        headerName: "Online",
        width: 120,
        renderCell: (params) => {
          const value = params.row.onlineStatus;

          return (
            <Chip
              size="small"
              variant="outlined"
              color={
                value === "online"
                  ? "success"
                  : value === "busy"
                  ? "warning"
                  : "default"
              }
              label={ONLINE_LABELS[value]}
            />
          );
        },
      },
      {
        field: "isAcceptingBookings",
        headerName: "Nhận booking",
        width: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            color={params.row.isAcceptingBookings ? "success" : "default"}
            label={params.row.isAcceptingBookings ? "Có" : "Không"}
          />
        ),
      },
      {
        field: "ratingAverage",
        headerName: "Đánh giá",
        width: 110,
        valueFormatter: (value) => Number(value).toFixed(1),
      },
      {
        field: "completedBookings",
        headerName: "Hoàn thành",
        width: 110,
      },
      {
        field: "actions",
        headerName: "Quản lý",
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Quản lý kỹ thuật viên">
            <IconButton
              size="small"
              color="primary"
              onClick={() => setSelectedTherapist(params.row)}
            >
              <ManageAccountsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <PageHeader
          title="Quản lý kỹ thuật viên"
          description="Quản lý hồ sơ, xác minh, dịch vụ, khu vực và lịch làm việc của kỹ thuật viên."
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            p: {
              xs: 1.5,
              sm: 2,
            },
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "2fr 1fr 1fr",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Tìm kiếm"
              placeholder="Tên, điện thoại, email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Xác minh</InputLabel>

              <Select
                label="Xác minh"
                value={verificationStatus}
                onChange={(event) => {
                  setVerificationStatus(
                    event.target.value as VerificationStatus | ""
                  );

                  setPaginationModel((prev) => ({
                    ...prev,
                    page: 0,
                  }));
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ xác minh</MenuItem>
                <MenuItem value="verified">Đã xác minh</MenuItem>
                <MenuItem value="rejected">Từ chối</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Online</InputLabel>

              <Select
                label="Online"
                value={onlineStatus}
                onChange={(event) => {
                  setOnlineStatus(event.target.value as OnlineStatus | "");

                  setPaginationModel((prev) => ({
                    ...prev,
                    page: 0,
                  }));
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="busy">Đang bận</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Nhận booking</InputLabel>

              <Select
                label="Nhận booking"
                value={acceptingBookings}
                onChange={(event) => {
                  setAcceptingBookings(
                    event.target.value as "" | "true" | "false"
                  );

                  setPaginationModel((prev) => ({
                    ...prev,
                    page: 0,
                  }));
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Đang nhận</MenuItem>
                <MenuItem value="false">Không nhận</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <GenericDataGrid<TherapistListItem>
          rows={rows}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth={1150}
        />
      </Box>

      <TherapistDetailDialog
        open={!!selectedTherapist}
        userId={selectedTherapist?.id ?? null}
        onClose={() => setSelectedTherapist(null)}
        onChanged={() => {
          void loadData();
        }}
      />
    </Box>
  );
}
