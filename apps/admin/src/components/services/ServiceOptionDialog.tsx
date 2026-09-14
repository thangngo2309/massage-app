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
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createServiceOption,
  ServiceOptionItem,
  updateServiceOption,
} from "@/lib/services";

interface FormValues {
  label: string;
  durationMinutes: string;
  defaultPrice: string;
  isActive: boolean;
}

interface Props {
  open: boolean;
  serviceId: number;
  mode: "create" | "edit";
  option?: ServiceOptionItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceOptionDialog({
  open,
  serviceId,
  mode,
  option,
  onClose,
  onSuccess,
}: Props) {
  const [serverError, setServerError] = useState("");

  const methods = useForm<FormValues>({
    defaultValues: {
      label: "",
      durationMinutes: "60",
      defaultPrice: "0",
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
    if (!open) {
      return;
    }

    setServerError("");

    if (mode === "edit" && option) {
      reset({
        label: option.label ?? "",
        durationMinutes: String(option.durationMinutes),
        defaultPrice: String(option.defaultPrice),
        isActive: option.isActive,
      });

      return;
    }

    reset({
      label: "",
      durationMinutes: "60",
      defaultPrice: "0",
      isActive: true,
    });
  }, [open, mode, option, reset]);

  const submit = async (values: FormValues) => {
    try {
      setServerError("");

      const payload = {
        label: values.label.trim() || null,
        durationMinutes: Number(values.durationMinutes),
        defaultPrice: Number(values.defaultPrice),
        isActive: values.isActive,
      };

      if (mode === "create") {
        await createServiceOption(serviceId, payload);
      } else {
        if (!option) {
          return;
        }

        await updateServiceOption(serviceId, option.id, payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Không thể lưu gói dịch vụ"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle
        component="div"
        sx={{
          pr: 7,
        }}
      >
        <Typography variant="h6">
          {mode === "create" ? "Thêm gói dịch vụ" : "Chỉnh sửa gói dịch vụ"}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Thiết lập thời lượng và giá mặc định
        </Typography>

        <IconButton
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            position: "absolute",

            right: 12,
            top: 12,
          }}
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
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
              pt: 1,
            }}
          >
            {serverError && (
              <Alert
                severity="error"
                sx={{
                  gridColumn: "1 / -1",
                }}
              >
                {serverError}
              </Alert>
            )}

            <Box
              sx={{
                gridColumn: "1 / -1",
              }}
            >
              <RHFTextField<FormValues>
                name="label"
                label="Tên gói"
                placeholder="Ví dụ: Massage 60 phút"
                fullWidth
                disabled={isSubmitting}
              />
            </Box>

            <RHFTextField<FormValues>
              name="durationMinutes"
              label="Thời lượng (phút)"
              type="number"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập thời lượng",

                validate: (value) => {
                  const number = Number(value);

                  if (!Number.isInteger(number) || number <= 0) {
                    return "Thời lượng phải là số nguyên lớn hơn 0";
                  }

                  return true;
                },
              }}
            />

            <RHFTextField<FormValues>
              name="defaultPrice"
              label="Giá mặc định (VNĐ)"
              type="number"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập giá",

                validate: (value) => {
                  const number = Number(value);

                  if (!Number.isInteger(number) || number < 0) {
                    return "Giá phải là số nguyên từ 0";
                  }

                  return true;
                },
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

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button color="inherit" onClick={onClose}>
            Hủy
          </Button>

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Lưu"
            )}
          </Button>
        </DialogActions>
      </RHFFormProvider>
    </Dialog>
  );
}
