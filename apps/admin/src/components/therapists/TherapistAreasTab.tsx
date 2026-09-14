"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
} from "@mui/material";

import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { GridColDef } from "@mui/x-data-grid";
import { Controller, useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createServiceArea,
  deleteServiceArea,
  ServiceAreaItem,
  ServiceAreaType,
  TherapistDetail,
  updateServiceArea,
} from "@/lib/therapists";
import { GenericDataGrid } from "../data-grid/GenericDataGrid";

interface Props {
  detail: TherapistDetail;
  onChanged: () => void;
}

interface FormValues {
  type: ServiceAreaType;
  areaName: string;
  provinceCode: string;
  districtCode: string;
  centerLatitude: string;
  centerLongitude: string;
  radiusKm: string;
  isActive: boolean;
}

export function TherapistAreasTab({ detail, onChanged }: Props) {
  const [error, setError] = useState("");

  const [dialog, setDialog] = useState<{
    open: boolean;
    item: ServiceAreaItem | null;
  }>({
    open: false,
    item: null,
  });

  const methods = useForm<FormValues>({
    defaultValues: {
      type: "district",
      areaName: "",
      provinceCode: "",
      districtCode: "",
      centerLatitude: "",
      centerLongitude: "",
      radiusKm: "10",
      isActive: true,
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const type = watch("type");

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    if (dialog.item) {
      reset({
        type: dialog.item.type,
        areaName: dialog.item.areaName ?? "",
        provinceCode: dialog.item.provinceCode ?? "",
        districtCode: dialog.item.districtCode ?? "",
        centerLatitude:
          dialog.item.centerLatitude !== null
            ? String(dialog.item.centerLatitude)
            : "",
        centerLongitude:
          dialog.item.centerLongitude !== null
            ? String(dialog.item.centerLongitude)
            : "",
        radiusKm:
          dialog.item.radiusKm !== null ? String(dialog.item.radiusKm) : "10",
        isActive: dialog.item.isActive,
      });
    } else {
      reset({
        type: "district",
        areaName: "",
        provinceCode: "",
        districtCode: "",
        centerLatitude: "",
        centerLongitude: "",
        radiusKm: "10",
        isActive: true,
      });
    }
  }, [dialog.open, dialog.item, reset]);

  const submit = async (values: FormValues) => {
    try {
      setError("");

      const payload =
        values.type === "district"
          ? {
              type: "district",
              areaName: values.areaName.trim() || null,
              provinceCode: values.provinceCode.trim() || null,
              districtCode: values.districtCode.trim() || null,
              isActive: values.isActive,
            }
          : {
              type: "radius",
              areaName: values.areaName.trim() || null,
              centerLatitude: Number(values.centerLatitude),
              centerLongitude: Number(values.centerLongitude),
              radiusKm: Number(values.radiusKm),
              isActive: values.isActive,
            };

      if (dialog.item) {
        await updateServiceArea(detail.userId, dialog.item.id, payload);
      } else {
        await createServiceArea(detail.userId, payload);
      }

      setDialog({
        open: false,
        item: null,
      });

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể lưu khu vực phục vụ"
      );
    }
  };

  const handleToggle = useCallback(
    async (item: ServiceAreaItem, checked: boolean) => {
      try {
        setError("");

        await updateServiceArea(detail.userId, item.id, {
          isActive: checked,
        });

        onChanged();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái khu vực"
        );
      }
    },
    [detail.userId, onChanged]
  );

  const handleDelete = useCallback(
    async (item: ServiceAreaItem) => {
      const confirmed = window.confirm(
        `Bạn có chắc muốn xóa khu vực "${item.areaName ?? "Không tên"}"?`
      );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        await deleteServiceArea(detail.userId, item.id);

        onChanged();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Không thể xóa khu vực"
        );
      }
    },
    [detail.userId, onChanged]
  );

  const columns = useMemo<GridColDef<ServiceAreaItem>[]>(
    () => [
      {
        field: "type",
        headerName: "Loại",
        width: 130,
        valueFormatter: (value) =>
          value === "radius" ? "Bán kính" : "Quận/Huyện",
      },
      {
        field: "areaName",
        headerName: "Khu vực",
        flex: 1,
        minWidth: 180,
        valueGetter: (_, row) => row.areaName || "-",
      },
      {
        field: "detail",
        headerName: "Chi tiết",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => {
          if (row.type === "radius") {
            return `${row.radiusKm ?? 0} km @ ${row.centerLatitude ?? "-"}, ${
              row.centerLongitude ?? "-"
            }`;
          }

          return row.districtCode || row.provinceCode || "-";
        },
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
              void handleToggle(params.row, event.target.checked)
            }
          />
        ),
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
            }}
          >
            <Tooltip title="Chỉnh sửa">
              <IconButton
                size="small"
                color="primary"
                onClick={() =>
                  setDialog({
                    open: true,
                    item: params.row,
                  })
                }
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Xóa">
              <IconButton
                size="small"
                color="error"
                onClick={() => void handleDelete(params.row)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleToggle, handleDelete]
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}

        <Box>
          <Button
            variant="contained"
            startIcon={<AddLocationAltIcon />}
            onClick={() =>
              setDialog({
                open: true,
                item: null,
              })
            }
          >
            Thêm khu vực
          </Button>
        </Box>

        <GenericDataGrid<ServiceAreaItem>
          rows={detail.serviceAreas}
          columns={columns}
          hideFooter
          minWidth={750}
        />
      </Box>

      <Dialog
        open={dialog.open}
        onClose={() =>
          setDialog({
            open: false,
            item: null,
          })
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle component="div" sx={{ pr: 7 }}>
          {dialog.item ? "Chỉnh sửa khu vực" : "Thêm khu vực"}

          <IconButton
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
            }}
            onClick={() =>
              setDialog({
                open: false,
                item: null,
              })
            }
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <RHFFormProvider methods={methods} onSubmit={handleSubmit(submit)}>
          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                pt: 1,
              }}
            >
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Loại khu vực</InputLabel>

                    <Select {...field} label="Loại khu vực">
                      <MenuItem value="district">Quận/Huyện</MenuItem>

                      <MenuItem value="radius">Bán kính</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <RHFTextField<FormValues>
                name="areaName"
                label="Tên khu vực"
                fullWidth
              />

              {type === "district" ? (
                <>
                  <RHFTextField<FormValues>
                    name="provinceCode"
                    label="Mã tỉnh/thành"
                    fullWidth
                  />

                  <RHFTextField<FormValues>
                    name="districtCode"
                    label="Mã quận/huyện"
                    fullWidth
                    rules={{
                      validate: (value, values) =>
                        !!value.toString().trim() ||
                        !!values.areaName.trim() ||
                        "Cần mã quận/huyện hoặc tên khu vực",
                    }}
                  />
                </>
              ) : (
                <Box
                  sx={{
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                    },

                    gap: 2,
                  }}
                >
                  <RHFTextField<FormValues>
                    name="centerLatitude"
                    label="Latitude"
                    type="number"
                    fullWidth
                    rules={{
                      required: "Vui lòng nhập latitude",
                    }}
                  />

                  <RHFTextField<FormValues>
                    name="centerLongitude"
                    label="Longitude"
                    type="number"
                    fullWidth
                    rules={{
                      required: "Vui lòng nhập longitude",
                    }}
                  />

                  <Box
                    sx={{
                      gridColumn: "1 / -1",
                    }}
                  >
                    <RHFTextField<FormValues>
                      name="radiusKm"
                      label="Bán kính (km)"
                      type="number"
                      fullWidth
                      rules={{
                        validate: (value) =>
                          Number(value) > 0 || "Bán kính phải lớn hơn 0",
                      }}
                    />
                  </Box>
                </Box>
              )}

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Đang hoạt động"
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              color="inherit"
              onClick={() =>
                setDialog({
                  open: false,
                  item: null,
                })
              }
            >
              Hủy
            </Button>

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Lưu
            </Button>
          </DialogActions>
        </RHFFormProvider>
      </Dialog>
    </>
  );
}
