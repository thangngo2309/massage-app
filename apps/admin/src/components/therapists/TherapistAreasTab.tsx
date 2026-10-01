"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { GridColDef } from "@mui/x-data-grid";

import { Controller, useForm } from "react-hook-form";

import { useCallback, useEffect, useMemo, useState } from "react";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  getAdministrativeProvinces,
  getAdministrativeWards,
  type AdministrativeProvinceItem,
  type AdministrativeWardItem,
} from "@/lib/locations";

import {
  createServiceArea,
  deleteServiceArea,
  type ServiceAreaItem,
  type ServiceAreaType,
  type TherapistDetail,
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

  wardCode: string;

  centerLatitude: string;

  centerLongitude: string;

  radiusKm: string;

  isActive: boolean;
}

const DEFAULT_VALUES: FormValues = {
  type: "ward",

  areaName: "",

  provinceCode: "",

  wardCode: "",

  centerLatitude: "",

  centerLongitude: "",

  radiusKm: "10",

  isActive: true,
};

export function TherapistAreasTab({ detail, onChanged }: Props) {
  const [error, setError] = useState("");

  const [provinces, setProvinces] = useState<AdministrativeProvinceItem[]>([]);

  const [wards, setWards] = useState<AdministrativeWardItem[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);

  const [loadingWards, setLoadingWards] = useState(false);

  const [dialog, setDialog] = useState<{
    open: boolean;
    item: ServiceAreaItem | null;
  }>({
    open: false,
    item: null,
  });

  const methods = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,

    formState: { isSubmitting },
  } = methods;

  const type = watch("type");

  const provinceCode = watch("provinceCode");

  const wardCode = watch("wardCode");

  const closeDialog = useCallback(() => {
    setDialog({
      open: false,
      item: null,
    });
  }, []);

  useEffect(() => {
    if (!dialog.open || provinces.length > 0) {
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoadingProvinces(true);

        const result = await getAdministrativeProvinces();

        if (active) {
          setProvinces(result);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải danh sách tỉnh/thành"
          );
        }
      } finally {
        if (active) {
          setLoadingProvinces(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [dialog.open, provinces.length]);

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    if (dialog.item) {
      reset({
        type: dialog.item.type,

        areaName: dialog.item.areaName ?? "",

        provinceCode: dialog.item.provinceCode ?? "",

        wardCode: dialog.item.wardCode ?? "",

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
      reset(DEFAULT_VALUES);
    }
  }, [dialog.open, dialog.item, reset]);

  useEffect(() => {
    if (!dialog.open || type !== "ward" || !provinceCode.trim()) {
      setWards([]);

      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoadingWards(true);

        const result = await getAdministrativeWards(provinceCode);

        if (active) {
          setWards(result);
        }
      } catch (loadError) {
        if (active) {
          setWards([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải danh sách phường/xã"
          );
        }
      } finally {
        if (active) {
          setLoadingWards(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [dialog.open, provinceCode, type]);

  const submit = async (values: FormValues) => {
    try {
      setError("");

      const payload =
        values.type === "ward"
          ? {
              type: "ward",

              provinceCode: values.provinceCode.trim(),

              wardCode: values.wardCode.trim(),

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

      closeDialog();

      onChanged();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể lưu khu vực phục vụ"
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
      } catch (toggleError) {
        setError(
          toggleError instanceof Error
            ? toggleError.message
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
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Không thể xóa khu vực"
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

        width: 150,

        valueFormatter: (value) =>
          value === "radius" ? "Bán kính" : "Phường/Xã",
      },

      {
        field: "areaName",

        headerName: "Khu vực",

        flex: 1,

        minWidth: 220,

        valueGetter: (_, row) => row.areaName || "-",
      },

      {
        field: "detail",

        headerName: "Chi tiết",

        flex: 1,

        minWidth: 240,

        valueGetter: (_, row) => {
          if (row.type === "radius") {
            return `${row.radiusKm ?? 0} km @ ${row.centerLatitude ?? "-"}, ${
              row.centerLongitude ?? "-"
            }`;
          }

          return (
            [row.wardCode, row.provinceCode].filter(Boolean).join(" / ") || "-"
          );
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

    [handleDelete, handleToggle]
  );

  const selectedWardExists = wards.some((ward) => ward.code === wardCode);

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
          minWidth={780}
        />
      </Box>

      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle
          component="div"
          sx={{
            pr: 7,
          }}
        >
          {dialog.item ? "Chỉnh sửa khu vực" : "Thêm khu vực"}

          <IconButton
            sx={{
              position: "absolute",

              top: 12,

              right: 12,
            }}
            onClick={closeDialog}
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

                    <Select
                      {...field}
                      label="Loại khu vực"
                      onChange={(event) => {
                        const value = event.target.value as ServiceAreaType;

                        field.onChange(value);

                        if (value === "ward") {
                          setValue("areaName", "");

                          setValue("centerLatitude", "");

                          setValue("centerLongitude", "");
                        } else {
                          setValue("provinceCode", "");

                          setValue("wardCode", "");

                          setWards([]);
                        }
                      }}
                    >
                      <MenuItem value="ward">Phường/Xã</MenuItem>

                      <MenuItem value="radius">Bán kính</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              {type === "ward" ? (
                <>
                  <Controller
                    name="provinceCode"
                    control={control}
                    rules={{
                      required: "Vui lòng chọn tỉnh/thành phố",
                    }}
                    render={({
                      field,

                      fieldState,
                    }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel>Tỉnh/Thành phố</InputLabel>

                        <Select
                          {...field}
                          label="Tỉnh/Thành phố"
                          disabled={loadingProvinces}
                          onChange={(event) => {
                            field.onChange(event.target.value);

                            setValue("wardCode", "");

                            setWards([]);
                          }}
                        >
                          {loadingProvinces && (
                            <MenuItem value="" disabled>
                              <CircularProgress size={18} />
                            </MenuItem>
                          )}

                          {provinces.map((province) => (
                            <MenuItem key={province.code} value={province.code}>
                              {province.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="wardCode"
                    control={control}
                    rules={{
                      required: "Vui lòng chọn phường/xã/đặc khu",
                    }}
                    render={({
                      field,

                      fieldState,
                    }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel>Phường/Xã/Đặc khu</InputLabel>

                        <Select
                          {...field}
                          label="Phường/Xã/Đặc khu"
                          disabled={!provinceCode || loadingWards}
                        >
                          {loadingWards && (
                            <MenuItem value="" disabled>
                              <CircularProgress size={18} />
                            </MenuItem>
                          )}

                          {!!field.value &&
                            !selectedWardExists &&
                            !loadingWards && (
                              <MenuItem value={field.value} disabled>
                                Mã cũ: {field.value}
                              </MenuItem>
                            )}

                          {wards.map((ward) => (
                            <MenuItem key={ward.code} value={ward.code}>
                              {ward.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </>
              ) : (
                <>
                  <RHFTextField<FormValues>
                    name="areaName"
                    label="Tên khu vực"
                    fullWidth
                  />

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
                </>
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
            <Button color="inherit" onClick={closeDialog}>
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
