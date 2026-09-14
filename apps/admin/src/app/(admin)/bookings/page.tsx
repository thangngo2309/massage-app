"use client";

import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { useCallback, useEffect, useState } from "react";

import { Controller, useForm } from "react-hook-form";

import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import {
  getBookings,
  type BookingItem,
  type BookingStatus,
} from "@/lib/bookings";

import { BookingDetailDialog } from "@/components/bookings/BookingDetailDialog";

import {
  BookingStatusChip,
  BOOKING_STATUS_LABELS,
} from "@/components/bookings/BookingStatusChip";
import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

interface FilterFormValues {
  q: string;

  status: BookingStatus | "";

  therapistId: string;
  clientId: string;

  from: string;
  to: string;
}

const STATUS_OPTIONS = Object.entries(BOOKING_STATUS_LABELS) as Array<
  [BookingStatus, string]
>;

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BookingsPage() {
  const [rows, setRows] = useState<BookingItem[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [total, setTotal] = useState(0);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [filters, setFilters] = useState<FilterFormValues>({
    q: "",
    status: "",
    therapistId: "",
    clientId: "",
    from: "",
    to: "",
  });

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null
  );

  const [detailOpen, setDetailOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: filters,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getBookings({
        page: paginationModel.page + 1,

        limit: paginationModel.pageSize,

        q: filters.q.trim() || undefined,

        status: filters.status,

        therapistId: filters.therapistId.trim()
          ? Number(filters.therapistId)
          : undefined,

        clientId: filters.clientId.trim()
          ? Number(filters.clientId)
          : undefined,

        from: filters.from || undefined,

        to: filters.to || undefined,
      });

      setRows(response.items);

      setTotal(response.pagination.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách booking"
      );
    } finally {
      setLoading(false);
    }
  }, [paginationModel, filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onSubmit = (values: FilterFormValues) => {
    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));

    setFilters(values);
  };

  const handleReset = () => {
    const emptyFilters: FilterFormValues = {
      q: "",
      status: "",
      therapistId: "",
      clientId: "",
      from: "",
      to: "",
    };

    reset(emptyFilters);

    setFilters(emptyFilters);

    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));
  };

  const handleOpenDetail = (id: number) => {
    setSelectedBookingId(id);

    setDetailOpen(true);
  };

  const columns: GridColDef<BookingItem>[] = [
    {
      field: "bookingCode",
      headerName: "Mã booking",
      minWidth: 170,
      flex: 1,
    },

    {
      field: "client",
      headerName: "Khách hàng",
      minWidth: 190,
      flex: 1,
      sortable: false,

      renderCell: (params) => (
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
            }}
          >
            {params.row.client?.user?.fullName ?? "-"}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {params.row.client?.user?.phone ?? "-"}
          </Typography>
        </Box>
      ),
    },

    {
      field: "therapist",
      headerName: "Kỹ thuật viên",
      minWidth: 190,
      flex: 1,
      sortable: false,

      renderCell: (params) => (
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
            }}
          >
            {params.row.therapist?.user?.fullName ?? "-"}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {params.row.therapist?.user?.phone ?? "-"}
          </Typography>
        </Box>
      ),
    },

    {
      field: "serviceName",
      headerName: "Dịch vụ",
      minWidth: 160,
      flex: 1,
    },

    {
      field: "scheduledAt",
      headerName: "Thời gian hẹn",
      minWidth: 170,

      valueFormatter: (value) => (value ? formatDateTime(String(value)) : "-"),
    },

    {
      field: "totalAmount",
      headerName: "Tổng tiền",
      minWidth: 140,
      align: "right",
      headerAlign: "right",

      valueFormatter: (value) => formatMoney(Number(value || 0)),
    },

    {
      field: "status",
      headerName: "Trạng thái",
      minWidth: 190,

      renderCell: (params) => <BookingStatusChip status={params.row.status} />,
    },

    {
      field: "actions",
      headerName: "Thao tác",
      width: 120,
      sortable: false,
      filterable: false,

      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => handleOpenDetail(params.row.id)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 700,
        }}
      >
        Quản lý booking
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <Controller
              name="q"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Tìm kiếm"
                  placeholder="Mã booking, khách hàng, kỹ thuật viên..."
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth label="Trạng thái">
                  <MenuItem value="">Tất cả</MenuItem>

                  {STATUS_OPTIONS.map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="therapistId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Therapist ID"
                />
              )}
            />

            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Client ID"
                />
              )}
            />

            <Controller
              name="from"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Từ ngày"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              )}
            />

            <Controller
              name="to"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Đến ngày"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              )}
            />
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 2,
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
            >
              Xóa lọc
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
            >
              Tìm kiếm
            </Button>
          </Stack>
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
          }}
        >
          {error}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
        }}
      >
        <GenericDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
          getRowId={(row: BookingItem) => row.id}
          sx={{
            minHeight: 560,
            border: 0,
          }}
        />
      </Paper>

      <BookingDetailDialog
        open={detailOpen}
        bookingId={selectedBookingId}
        onClose={() => setDetailOpen(false)}
        onChanged={() => {
          void loadData();
        }}
      />
    </Box>
  );
}
