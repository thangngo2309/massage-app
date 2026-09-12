"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common";
import { UserDialog } from "@/components/users/UserDialog";
import type { AuthUser, UserRole } from "@/lib/auth";
import { getUsers, updateUserStatus, UserStatus } from "@/lib/users";
import { useAuthStore } from "@/store/authStore";
import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  system_admin: "System Admin",
  client: "Khách hàng",
  therapist: "Kỹ thuật viên",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Hoạt động",
  inactive: "Chưa kích hoạt",
  suspended: "Tạm khóa",
};

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
}[] = [
  {
    value: "super_admin",
    label: "Super Admin",
  },
  {
    value: "system_admin",
    label: "System Admin",
  },
  {
    value: "client",
    label: "Khách hàng",
  },
  {
    value: "therapist",
    label: "Kỹ thuật viên",
  },
];

const STATUS_OPTIONS: {
  value: UserStatus;
  label: string;
}[] = [
  {
    value: "active",
    label: "Hoạt động",
  },
  {
    value: "inactive",
    label: "Chưa kích hoạt",
  },
  {
    value: "suspended",
    label: "Tạm khóa",
  },
];

type UserDialogState = {
  open: boolean;
  mode: "create" | "edit";
  user: AuthUser | null;
};

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);

  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [rowCount, setRowCount] = useState(0);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [dialog, setDialog] = useState<UserDialogState>({
    open: false,
    mode: "create",
    user: null,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());

      setPaginationModel((prev) => ({
        ...prev,
        page: 0,
      }));
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const response = await getUsers({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: debouncedSearch,
        role,
        status,
      });

      setRows(response.items);
      setRowCount(response.pagination.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách người dùng"
      );
    } finally {
      setLoading(false);
    }
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearch,
    role,
    status,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /**
   * Rule FE giống Backend.
   */
  const canEditUser = useCallback(
    (targetUser: AuthUser) => {
      if (currentUser?.role === "super_admin") {
        return targetUser.role !== "super_admin";
      }

      if (currentUser?.role === "system_admin") {
        return targetUser.role === "client" || targetUser.role === "therapist";
      }

      return false;
    },
    [currentUser?.role]
  );

  const handleUpdateStatus = useCallback(
    async (user: AuthUser, newStatus: UserStatus) => {
      try {
        setError("");

        await updateUserStatus(user.id, newStatus);

        await loadData();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái người dùng"
        );
      }
    },
    [loadData]
  );

  const getStatusColor = (
    value: UserStatus
  ): "success" | "warning" | "error" | "default" => {
    switch (value) {
      case "active":
        return "success";

      case "inactive":
        return "warning";

      case "suspended":
        return "error";

      default:
        return "default";
    }
  };

  const columns = useMemo<GridColDef<AuthUser>[]>(
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
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => row.email || "-",
      },
      {
        field: "role",
        headerName: "Vai trò",
        width: 160,
        renderCell: (params) => {
          const value = params.row.role;

          return (
            <Chip
              size="small"
              label={ROLE_LABELS[value]}
              sx={{
                bgcolor:
                  value === "super_admin"
                    ? "#EDE9FE"
                    : value === "system_admin"
                    ? "#E0E7FF"
                    : value === "therapist"
                    ? "#E6F7F5"
                    : "#F1F5F9",

                color:
                  value === "super_admin"
                    ? "#6D28D9"
                    : value === "system_admin"
                    ? "#4338CA"
                    : value === "therapist"
                    ? "#0F766E"
                    : "#475569",
              }}
            />
          );
        },
      },
      {
        field: "status",
        headerName: "Trạng thái",
        width: 185,
        sortable: false,
        renderCell: (params) => {
          const user = params.row;
          const value = user.status as UserStatus;
          const editable = canEditUser(user);

          if (!editable) {
            return (
              <Chip
                size="small"
                color={getStatusColor(value)}
                label={STATUS_LABELS[value] ?? value}
              />
            );
          }

          return (
            <Select
              size="small"
              value={value}
              sx={{
                minWidth: 140,
              }}
              onChange={(event) => {
                void handleUpdateStatus(user, event.target.value as UserStatus);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          );
        },
      },

      {
        field: "actions",

        headerName: "Thao tác",

        width: 100,

        sortable: false,

        filterable: false,

        renderCell: (params) => {
          if (!canEditUser(params.row)) {
            return null;
          }

          return (
            <Tooltip title="Chỉnh sửa">
              <IconButton
                size="small"
                color="primary"
                onClick={() =>
                  setDialog({
                    open: true,

                    mode: "edit",

                    user: params.row,
                  })
                }
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        },
      },
    ],
    [canEditUser, handleUpdateStatus]
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
          title="Quản lý người dùng"
          description="Quản lý khách hàng, kỹ thuật viên và tài khoản quản trị."
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() =>
                setDialog({
                  open: true,

                  mode: "create",

                  user: null,
                })
              }
            >
              Thêm người dùng
            </Button>
          }
        />

        {error && <Alert severity="error">{error}</Alert>}

        {/* FILTER */}
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

                sm: "repeat(2, minmax(0, 1fr))",

                lg: "2fr 1fr 1fr",
              },

              gap: 2,
            }}
          >
            <TextField
              label="Tìm kiếm"
              placeholder="Tên, email, số điện thoại"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              fullWidth
              sx={{
                gridColumn: {
                  xs: "auto",

                  sm: "1 / -1",

                  lg: "auto",
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>

              <Select
                label="Vai trò"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as UserRole | "");

                  setPaginationModel((prev) => ({
                    ...prev,

                    page: 0,
                  }));
                }}
              >
                <MenuItem value="">Tất cả vai trò</MenuItem>

                {ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>

              <Select
                label="Trạng thái"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as UserStatus | "");

                  setPaginationModel((prev) => ({
                    ...prev,

                    page: 0,
                  }));
                }}
              >
                <MenuItem value="">Tất cả trạng thái</MenuItem>

                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <GenericDataGrid<AuthUser>
          rows={rows}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth={1050}
        />
      </Box>

      <UserDialog
        open={dialog.open}
        mode={dialog.mode}
        user={dialog.user}
        onClose={() =>
          setDialog((previous) => ({
            ...previous,

            open: false,
          }))
        }
        onSuccess={() => {
          void loadData();
        }}
      />
    </Box>
  );
}
