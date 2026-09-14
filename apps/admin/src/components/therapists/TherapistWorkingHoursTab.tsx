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
import DeleteIcon from "@mui/icons-material/Delete";

import { GridColDef } from "@mui/x-data-grid";
import { Controller, useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createWorkingHour,
  deleteWorkingHour,
  TherapistDetail,
  updateWorkingHour,
  WorkingHourItem,
} from "@/lib/therapists";
import { GenericDataGrid } from "../data-grid/GenericDataGrid";

const DAY_LABELS = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

interface Props {
  detail: TherapistDetail;
  onChanged: () => void;
}

interface FormValues {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export function TherapistWorkingHoursTab({ detail, onChanged }: Props) {
  const [error, setError] = useState("");

  const [dialog, setDialog] = useState<{
    open: boolean;
    item: WorkingHourItem | null;
  }>({
    open: false,
    item: null,
  });

  const methods = useForm<FormValues>({
    defaultValues: {
      dayOfWeek: "1",
      startTime: "08:00",
      endTime: "17:00",
      isActive: true,
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    if (dialog.item) {
      reset({
        dayOfWeek: String(dialog.item.dayOfWeek),

        startTime: dialog.item.startTime.slice(0, 5),

        endTime: dialog.item.endTime.slice(0, 5),

        isActive: dialog.item.isActive,
      });
    } else {
      reset({
        dayOfWeek: "1",
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
      });
    }
  }, [dialog.open, dialog.item, reset]);

  const submit = async (values: FormValues) => {
    try {
      setError("");

      const payload = {
        dayOfWeek: Number(values.dayOfWeek),

        startTime: values.startTime,

        endTime: values.endTime,

        isActive: values.isActive,
      };

      if (dialog.item) {
        await updateWorkingHour(detail.userId, dialog.item.id, payload);
      } else {
        await createWorkingHour(detail.userId, payload);
      }

      setDialog({
        open: false,
        item: null,
      });

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể lưu giờ làm việc"
      );
    }
  };

  const handleToggle = useCallback(
    async (item: WorkingHourItem, checked: boolean) => {
      try {
        await updateWorkingHour(detail.userId, item.id, {
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

  const handleDelete = useCallback(
    async (item: WorkingHourItem) => {
      const confirmed = window.confirm(
        `Bạn có chắc muốn xóa khung giờ ${
          DAY_LABELS[item.dayOfWeek]
        } ${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}?`
      );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        await deleteWorkingHour(detail.userId, item.id);

        onChanged();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Không thể xóa khung giờ"
        );
      }
    },
    [detail.userId, onChanged]
  );
  
  const columns = useMemo<GridColDef<WorkingHourItem>[]>(
    () => [
      {
        field: "dayOfWeek",
        headerName: "Ngày",
        flex: 1,
        minWidth: 130,
        valueFormatter: (value) => DAY_LABELS[Number(value)],
      },
      {
        field: "startTime",
        headerName: "Bắt đầu",
        width: 120,
        valueFormatter: (value) => String(value).slice(0, 5),
      },
      {
        field: "endTime",
        headerName: "Kết thúc",
        width: 120,
        valueFormatter: (value) => String(value).slice(0, 5),
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
            startIcon={<AddIcon />}
            onClick={() =>
              setDialog({
                open: true,
                item: null,
              })
            }
          >
            Thêm khung giờ
          </Button>
        </Box>

        <GenericDataGrid<WorkingHourItem>
          rows={detail.workingHours}
          columns={columns}
          hideFooter
          minWidth={650}
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
          {dialog.item ? "Chỉnh sửa khung giờ" : "Thêm khung giờ"}

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
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: 2,
                pt: 1,
              }}
            >
              <Box
                sx={{
                  gridColumn: "1 / -1",
                }}
              >
                <Controller
                  name="dayOfWeek"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Ngày</InputLabel>

                      <Select {...field} label="Ngày">
                        {DAY_LABELS.map((label, index) => (
                          <MenuItem key={index} value={String(index)}>
                            {label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>

              <RHFTextField<FormValues>
                name="startTime"
                label="Giờ bắt đầu"
                type="time"
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                rules={{
                  required: "Vui lòng chọn giờ bắt đầu",
                }}
              />

              <RHFTextField<FormValues>
                name="endTime"
                label="Giờ kết thúc"
                type="time"
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                rules={{
                  required: "Vui lòng chọn giờ kết thúc",

                  validate: (value, values) =>
                    value > values.startTime ||
                    "Giờ kết thúc phải lớn hơn giờ bắt đầu",
                }}
              />

              <Box
                sx={{
                  gridColumn: "1 / -1",
                }}
              >
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
