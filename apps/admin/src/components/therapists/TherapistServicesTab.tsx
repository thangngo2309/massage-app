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

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

import { GridColDef } from "@mui/x-data-grid";

import { Controller, useForm } from "react-hook-form";

import { useCallback, useEffect, useMemo, useState } from "react";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createTherapistService,
  getTherapistServiceOptions,
  ServiceOptionLookup,
  TherapistDetail,
  TherapistServiceItem,
  updateTherapistService,
} from "@/lib/therapists";
import { GenericDataGrid } from "../data-grid/GenericDataGrid";

interface Props {
  detail: TherapistDetail;
  onChanged: () => void;
}

interface FormValues {
  serviceOptionId: string;
  price: string;
  platformFeeRate: string;
  isActive: boolean;
}

export function TherapistServicesTab({ detail, onChanged }: Props) {
  const [dialog, setDialog] = useState<{
    open: boolean;
    item: TherapistServiceItem | null;
  }>({
    open: false,
    item: null,
  });

  const [lookups, setLookups] = useState<ServiceOptionLookup[]>([]);

  const [error, setError] = useState("");

  const methods = useForm<FormValues>({
    defaultValues: {
      serviceOptionId: "",
      price: "0",
      platformFeeRate: "0",
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

  const selectedOptionId = watch("serviceOptionId");

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    void (async () => {
      try {
        const response = await getTherapistServiceOptions();

        setLookups(
          response.filter((item) => item.isActive && item.serviceIsActive)
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách dịch vụ"
        );
      }
    })();

    if (dialog.item) {
      reset({
        serviceOptionId: String(dialog.item.serviceOptionId),

        price: String(dialog.item.price),

        platformFeeRate: String(dialog.item.platformFeeRate),

        isActive: dialog.item.isActive,
      });
    } else {
      reset({
        serviceOptionId: "",
        price: "0",
        platformFeeRate: "0",
        isActive: true,
      });
    }
  }, [dialog.open, dialog.item, reset]);

  useEffect(() => {
    if (dialog.item || !selectedOptionId) {
      return;
    }

    const option = lookups.find((item) => item.id === Number(selectedOptionId));

    if (option) {
      methods.setValue("price", String(option.defaultPrice));
    }
  }, [selectedOptionId, lookups, dialog.item, methods]);

  const submit = async (values: FormValues) => {
    try {
      setError("");

      if (dialog.item) {
        await updateTherapistService(detail.userId, dialog.item.id, {
          price: Number(values.price),

          platformFeeRate: Number(values.platformFeeRate),

          isActive: values.isActive,
        });
      } else {
        await createTherapistService(detail.userId, {
          serviceOptionId: Number(values.serviceOptionId),

          price: Number(values.price),

          platformFeeRate: Number(values.platformFeeRate),

          isActive: values.isActive,
        });
      }

      setDialog({
        open: false,
        item: null,
      });

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể lưu dịch vụ"
      );
    }
  };

  const handleToggle = useCallback(
    async (item: TherapistServiceItem, checked: boolean) => {
      try {
        await updateTherapistService(detail.userId, item.id, {
          isActive: checked,
        });

        onChanged();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái"
        );
      }
    },
    [detail.userId, onChanged]
  );

  const columns = useMemo<GridColDef<TherapistServiceItem>[]>(
    () => [
      {
        field: "service",
        headerName: "Dịch vụ",
        flex: 1,
        minWidth: 180,

        valueGetter: (_, row) => row.option.service.name,
      },

      {
        field: "duration",
        headerName: "Thời lượng",
        width: 120,

        valueGetter: (_, row) => `${row.option.durationMinutes} phút`,
      },

      {
        field: "price",
        headerName: "Giá KTV",
        width: 150,

        valueFormatter: (value) => `${Number(value).toLocaleString("vi-VN")} ₫`,
      },

      {
        field: "platformFeeRate",

        headerName: "Phí nền tảng",

        width: 130,

        valueFormatter: (value) => `${Number(value)}%`,
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
        width: 90,
        sortable: false,

        renderCell: (params) => (
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
        ),
      },
    ],
    [handleToggle]
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
            startIcon={<AddIcon />}
            onClick={() =>
              setDialog({
                open: true,
                item: null,
              })
            }
          >
            Thêm dịch vụ
          </Button>
        </Box>

        <GenericDataGrid<TherapistServiceItem>
          rows={detail.services}
          columns={columns}
          hideFooter
          minWidth={850}
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
        <DialogTitle
          component="div"
          sx={{
            pr: 7,
          }}
        >
          {dialog.item ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ"}

          <IconButton
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
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
                name="serviceOptionId"
                control={control}
                rules={{
                  required: "Vui lòng chọn dịch vụ",
                }}
                render={({ field, fieldState }) => (
                  <FormControl
                    fullWidth
                    error={!!fieldState.error}
                    disabled={!!dialog.item}
                  >
                    <InputLabel>Gói dịch vụ</InputLabel>

                    <Select {...field} label="Gói dịch vụ">
                      {lookups.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {item.serviceName} - {item.durationMinutes} phút
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <RHFTextField<FormValues>
                name="price"
                label="Giá KTV (VNĐ)"
                type="number"
                fullWidth
                rules={{
                  validate: (value) => Number(value) >= 0 || "Giá không hợp lệ",
                }}
              />

              <RHFTextField<FormValues>
                name="platformFeeRate"
                label="Phí nền tảng (%)"
                type="number"
                fullWidth
                rules={{
                  validate: (value) => {
                    const number = Number(value);

                    return (
                      (number >= 0 && number <= 100) || "Phí phải từ 0 đến 100%"
                    );
                  },
                }}
              />

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
