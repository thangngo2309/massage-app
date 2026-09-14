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
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import TuneIcon from "@mui/icons-material/Tune";

import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common";
import { ServiceDialog } from "@/components/services/ServiceDialog";
import { ServiceOptionsDialog } from "@/components/services/ServiceOptionsDialog";

import {
  getServices,
  MassageServiceItem,
  updateServiceActive,
} from "@/lib/services";
import { GenericDataGrid } from "@/components/data-grid/GenericDataGrid";

type ActiveFilter = "" | "active" | "inactive";

type ServiceDialogState = {
  open: boolean;
  mode: "create" | "edit";
  service: MassageServiceItem | null;
};

export default function ServicesPage() {
  const [rows, setRows] = useState<MassageServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
  const [rowCount, setRowCount] = useState(0);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [serviceDialog, setServiceDialog] = useState<ServiceDialogState>({
    open: false,
    mode: "create",
    service: null,
  });

  const [optionsService, setOptionsService] =
    useState<MassageServiceItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPaginationModel((prev) => ({
        ...prev,
        page: 0,
      }));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getServices({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: debouncedSearch,
        isActive: activeFilter === "" ? undefined : activeFilter === "active",
      });

      setRows(response.items);

      setRowCount(response.pagination.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách dịch vụ"
      );
    } finally {
      setLoading(false);
    }
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearch,
    activeFilter,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleActive = useCallback(
    async (service: MassageServiceItem, checked: boolean) => {
      try {
        setError("");
        await updateServiceActive(service.id, checked);

        await loadData();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái dịch vụ"
        );
      }
    },
    [loadData]
  );

  const columns = useMemo<GridColDef<MassageServiceItem>[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 70,
      },
      {
        field: "name",
        headerName: "Tên dịch vụ",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "slug",
        headerName: "Slug",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "optionCount",
        headerName: "Số gói",
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.optionCount}
            sx={{
              minWidth: 40,
            }}
          />
        ),
      },
      {
        field: "sortOrder",
        headerName: "Thứ tự",
        width: 100,
      },
      {
        field: "isActive",
        headerName: "Hoạt động",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Switch
            checked={params.row.isActive}
            onChange={(event) =>
              void handleToggleActive(params.row, event.target.checked)
            }
          />
        ),
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
            }}
          >
            <Tooltip title="Chỉnh sửa dịch vụ">
              <IconButton
                size="small"
                color="primary"
                onClick={() =>
                  setServiceDialog({
                    open: true,
                    mode: "edit",
                    service: params.row,
                  })
                }
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Quản lý các gói thời lượng">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => setOptionsService(params.row)}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleToggleActive]
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
          title="Quản lý dịch vụ"
          description="Quản lý danh mục dịch vụ massage, thời lượng và giá mặc định."
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() =>
                setServiceDialog({
                  open: true,
                  mode: "create",
                  service: null,
                })
              }
            >
              Thêm dịch vụ
            </Button>
          }
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
                md: "2fr 1fr",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Tìm kiếm"
              placeholder="Tên dịch vụ, slug, mô tả"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>

              <Select
                label="Trạng thái"
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value as ActiveFilter);
                  setPaginationModel((prev) => ({
                    ...prev,
                    page: 0,
                  }));
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <GenericDataGrid<MassageServiceItem>
          rows={rows}
          columns={columns}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          minWidth={1000}
        />
      </Box>

      <ServiceDialog
        open={serviceDialog.open}
        mode={serviceDialog.mode}
        service={serviceDialog.service}
        onClose={() =>
          setServiceDialog((prev) => ({
            ...prev,
            open: false,
          }))
        }
        onSuccess={() => {
          void loadData();
        }}
      />

      <ServiceOptionsDialog
        open={!!optionsService}
        service={optionsService}
        onClose={() => setOptionsService(null)}
        onChanged={() => {
          void loadData();
        }}
      />
    </Box>
  );
}
