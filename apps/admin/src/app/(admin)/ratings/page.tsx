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
import StarIcon from "@mui/icons-material/Star";

import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { getRatings, type RatingItem } from "@/lib/ratings";

import { RatingDetailDialog } from "@/components/ratings/RatingDetailDialog";
import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

interface FilterValues {
  q: string;

  therapistId: string;

  rating: string;

  visibility: "" | "true" | "false";

  from: string;
  to: string;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function RatingsPage() {
  const [rows, setRows] = useState<RatingItem[]>([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [filters, setFilters] = useState<FilterValues>({
    q: "",
    therapistId: "",
    rating: "",
    visibility: "",
    from: "",
    to: "",
  });

  const { control, handleSubmit, reset } = useForm<FilterValues>({
    defaultValues: filters,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getRatings({
        page: paginationModel.page + 1,

        limit: paginationModel.pageSize,

        q: filters.q.trim() || undefined,

        therapistId: filters.therapistId
          ? Number(filters.therapistId)
          : undefined,

        rating: filters.rating ? Number(filters.rating) : undefined,

        isVisible:
          filters.visibility === "" ? undefined : filters.visibility === "true",

        from: filters.from || undefined,

        to: filters.to || undefined,
      });

      setRows(response.items);

      setTotal(response.pagination.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách đánh giá"
      );
    } finally {
      setLoading(false);
    }
  }, [paginationModel, filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onSubmit = (values: FilterValues) => {
    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));

    setFilters(values);
  };

  const handleReset = () => {
    const values: FilterValues = {
      q: "",
      therapistId: "",
      rating: "",
      visibility: "",
      from: "",
      to: "",
    };

    reset(values);
    setFilters(values);

    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));
  };

  const columns: GridColDef<RatingItem>[] = [
    {
      field: "bookingCode",
      headerName: "Booking",
      minWidth: 160,
      valueGetter: (_, row) => row.booking?.bookingCode ?? "-",
    },
    {
      field: "client",
      headerName: "Khách hàng",
      minWidth: 180,
      flex: 1,
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
      minWidth: 180,
      flex: 1,

      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
          }}
        >
          {params.row.therapist?.user?.fullName ?? "-"}
        </Typography>
      ),
    },
    {
      field: "rating",
      headerName: "Đánh giá",
      width: 130,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{alignItems: "center"}}>
          <StarIcon fontSize="small" color="warning" />

          <Typography
            sx={{
              fontWeight: 700,
            }}
          >
            {params.row.rating}/5
          </Typography>
        </Stack>
      ),
    },
    {
      field: "comment",
      headerName: "Nhận xét",
      minWidth: 240,
      flex: 1,
    },

    {
      field: "isVisible",
      headerName: "Hiển thị",
      width: 110,
      valueFormatter: (value) => (value ? "Có" : "Không"),
    },
    {
      field: "createdAt",
      headerName: "Ngày đánh giá",
      minWidth: 160,
      valueFormatter: (value) => (value ? formatDateTime(String(value)) : "-"),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => {
            setSelectedId(params.row.id);

            setDetailOpen(true);
          }}
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
        Quản lý đánh giá
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
                  placeholder="Booking, khách hàng, kỹ thuật viên..."
                />
              )}
            />

            <Controller
              name="therapistId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  fullWidth
                  label="Therapist ID"
                />
              )}
            />

            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth label="Số sao">
                  <MenuItem value="">Tất cả</MenuItem>

                  {[5, 4, 3, 2, 1].map((value) => (
                    <MenuItem key={value} value={String(value)}>
                      {value} sao
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Trạng thái hiển thị"
                >
                  <MenuItem value="">Tất cả</MenuItem>

                  <MenuItem value="true">Đang hiển thị</MenuItem>

                  <MenuItem value="false">Đã ẩn</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="from"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  fullWidth
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
                  type="date"
                  fullWidth
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
          getRowId={(row: RatingItem) => row.id}
          sx={{
            minHeight: 560,
            border: 0,
          }}
        />
      </Paper>

      <RatingDetailDialog
        open={detailOpen}
        ratingId={selectedId}
        onClose={() => setDetailOpen(false)}
        onChanged={() => {
          void loadData();
        }}
      />
    </Box>
  );
}
