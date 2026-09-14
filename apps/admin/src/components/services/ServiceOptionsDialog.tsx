"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

import { GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getService,
  MassageServiceItem,
  ServiceOptionItem,
  updateServiceOptionActive,
} from "@/lib/services";

import { ServiceOptionDialog } from "./ServiceOptionDialog";
import { GenericDataGrid } from "../data-grid/GenericDataGrid";

interface Props {
  open: boolean;
  service: MassageServiceItem | null;
  onClose: () => void;
  onChanged: () => void;
}

export function ServiceOptionsDialog({
  open,
  service,
  onClose,
  onChanged,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [rows, setRows] = useState<ServiceOptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [optionDialog, setOptionDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    option: ServiceOptionItem | null;
  }>({
    open: false,
    mode: "create",
    option: null,
  });

  const loadData = useCallback(async () => {
    if (!service) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const detail = await getService(service.id);

      setRows(detail.options);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải các gói dịch vụ"
      );
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, loadData]);

  const handleToggle = useCallback(
    async (option: ServiceOptionItem, checked: boolean) => {
      if (!service) {
        return;
      }

      try {
        await updateServiceOptionActive(service.id, option.id, checked);

        await loadData();

        onChanged();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái"
        );
      }
    },
    [service, loadData, onChanged]
  );

  const columns = useMemo<GridColDef<ServiceOptionItem>[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 70,
      },
      {
        field: "label",
        headerName: "Tên gói",
        flex: 1,
        minWidth: 180,
        valueGetter: (_, row) => row.label || `${row.durationMinutes} phút`,
      },
      {
        field: "durationMinutes",
        headerName: "Thời lượng",
        width: 130,
        valueFormatter: (value) => `${value} phút`,
      },
      {
        field: "defaultPrice",
        headerName: "Giá mặc định",
        width: 160,
        valueFormatter: (value) => `${Number(value).toLocaleString("vi-VN")} ₫`,
      },
      {
        field: "isActive",
        headerName: "Hoạt động",
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <Switch
            checked={params.row.isActive}
            onChange={(event) =>
              void handleToggle(params.row, event.target.checked)
            }
          />
        ),
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                setOptionDialog({
                  open: true,
                  mode: "edit",
                  option: params.row,
                })
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [handleToggle]
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen}
      >
        <DialogTitle
          component="div"
          sx={{
            pr: 7,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6">Gói dịch vụ</Typography>

              <Typography variant="body2" color="text.secondary">
                {service?.name}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                setOptionDialog({
                  open: true,

                  mode: "create",

                  option: null,
                })
              }
            >
              Thêm gói
            </Button>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",

              top: 12,
              right: 12,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              pt: 1,
            }}
          >
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

            {loading && !rows.length ? (
              <Box
                sx={{
                  minHeight: 180,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <GenericDataGrid<ServiceOptionItem>
                rows={rows}
                columns={columns}
                loading={loading}
                hideFooter
                minWidth={750}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {service && (
        <ServiceOptionDialog
          open={optionDialog.open}
          serviceId={service.id}
          mode={optionDialog.mode}
          option={optionDialog.option}
          onClose={() =>
            setOptionDialog((prev) => ({
              ...prev,

              open: false,
            }))
          }
          onSuccess={() => {
            void loadData();

            onChanged();
          }}
        />
      )}
    </>
  );
}
