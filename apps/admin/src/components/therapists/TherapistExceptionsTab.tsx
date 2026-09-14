"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Tooltip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { GridColDef } from "@mui/x-data-grid";

import { Controller, useForm } from "react-hook-form";

import { useEffect, useMemo, useState } from "react";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createScheduleException,
  deleteScheduleException,
  ScheduleExceptionItem,
  TherapistDetail,
  updateScheduleException,
} from "@/lib/therapists";
import { GenericDataGrid } from "../data-grid/GenericDataGrid";

interface Props {
  detail: TherapistDetail;
  onChanged: () => void;
}

interface FormValues {
  date: string;
  isDayOff: boolean;
  startTime: string;
  endTime: string;
  note: string;
}

export function TherapistExceptionsTab({ detail, onChanged }: Props) {
  const [error, setError] = useState("");

  const [dialog, setDialog] = useState<{
    open: boolean;
    item: ScheduleExceptionItem | null;
  }>({
    open: false,
    item: null,
  });

  const methods = useForm<FormValues>({
    defaultValues: {
      date: "",
      isDayOff: true,
      startTime: "08:00",
      endTime: "17:00",
      note: "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const isDayOff = watch("isDayOff");

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    if (dialog.item) {
      reset({
        date: dialog.item.date,

        isDayOff: dialog.item.isDayOff,

        startTime: dialog.item.startTime?.slice(0, 5) ?? "08:00",

        endTime: dialog.item.endTime?.slice(0, 5) ?? "17:00",

        note: dialog.item.note ?? "",
      });
    } else {
      reset({
        date: "",
        isDayOff: true,
        startTime: "08:00",
        endTime: "17:00",
        note: "",
      });
    }
  }, [dialog.open, dialog.item, reset]);

  const submit = async (values: FormValues) => {
    try {
      setError("");

      const payload = {
        date: values.date,

        isDayOff: values.isDayOff,

        startTime: values.isDayOff ? null : values.startTime,

        endTime: values.isDayOff ? null : values.endTime,

        note: values.note.trim() || null,
      };

      if (dialog.item) {
        await updateScheduleException(detail.userId, dialog.item.id, payload);
      } else {
        await createScheduleException(detail.userId, payload);
      }

      setDialog({
        open: false,
        item: null,
      });

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể lưu ngày ngoại lệ"
      );
    }
  };

  const handleDelete = async (item: ScheduleExceptionItem) => {
    if (!window.confirm(`Xóa ngoại lệ ngày ${item.date}?`)) {
      return;
    }

    try {
      await deleteScheduleException(detail.userId, item.id);

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể xóa ngày ngoại lệ"
      );
    }
  };

  const columns = useMemo<GridColDef<ScheduleExceptionItem>[]>(
    () => [
      {
        field: "date",
        headerName: "Ngày",
        width: 130,
      },

      {
        field: "type",
        headerName: "Loại",
        width: 130,

        valueGetter: (_, row) =>
          row.isDayOff ? "Nghỉ cả ngày" : "Giờ đặc biệt",
      },

      {
        field: "time",
        headerName: "Khung giờ",
        width: 160,

        valueGetter: (_, row) =>
          row.isDayOff
            ? "-"
            : `${row.startTime?.slice(0, 5)} - ${row.endTime?.slice(0, 5)}`,
      },

      {
        field: "note",
        headerName: "Ghi chú",
        flex: 1,
        minWidth: 180,

        valueGetter: (_, row) => row.note || "-",
      },

      {
        field: "actions",
        headerName: "Thao tác",
        width: 110,
        sortable: false,

        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
            }}
          >
            <Tooltip title="Sửa">
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
    []
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
            Thêm ngày ngoại lệ
          </Button>
        </Box>

        <GenericDataGrid<ScheduleExceptionItem>
          rows={detail.scheduleExceptions}
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
          {dialog.item ? "Chỉnh sửa ngày ngoại lệ" : "Thêm ngày ngoại lệ"}

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
              <RHFTextField<FormValues>
                name="date"
                label="Ngày"
                type="date"
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                rules={{
                  required: "Vui lòng chọn ngày",
                }}
              />

              <Controller
                name="isDayOff"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="Nghỉ cả ngày"
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

              {!isDayOff && (
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
                    name="startTime"
                    label="Giờ bắt đầu"
                    type="time"
                    fullWidth
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
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
                  />
                </Box>
              )}

              <RHFTextField<FormValues>
                name="note"
                label="Ghi chú"
                multiline
                minRows={3}
                fullWidth
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
