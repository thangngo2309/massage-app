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
  useMediaQuery,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createService,
  MassageServiceItem,
  updateService,
} from "@/lib/services";

interface FormValues {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
}

interface Props {
  open: boolean;

  mode: "create" | "edit";

  service?: MassageServiceItem | null;

  onClose: () => void;

  onSuccess: () => void;
}

export function ServiceDialog({
  open,
  mode,
  service,
  onClose,
  onSuccess,
}: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [serverError, setServerError] = useState("");

  const methods = useForm<FormValues>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      sortOrder: "0",
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

    if (mode === "edit" && service) {
      reset({
        name: service.name,

        slug: service.slug,

        description: service.description ?? "",

        imageUrl: service.imageUrl ?? "",

        sortOrder: String(service.sortOrder),

        isActive: service.isActive,
      });

      return;
    }

    reset({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      sortOrder: "0",
      isActive: true,
    });
  }, [open, mode, service, reset]);

  const submit = async (values: FormValues) => {
    try {
      setServerError("");

      const payload = {
        name: values.name.trim(),

        ...(values.slug.trim()
          ? {
              slug: values.slug.trim().toLowerCase(),
            }
          : {}),

        description: values.description.trim() || null,

        imageUrl: values.imageUrl.trim() || null,

        sortOrder: Number(values.sortOrder),

        isActive: values.isActive,
      };

      if (mode === "create") {
        await createService(payload);
      } else {
        if (!service) {
          return;
        }

        await updateService(service.id, payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Không thể lưu dịch vụ"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
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
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              borderRadius: 2,

              bgcolor: "#E6F7F5",

              color: "primary.main",
            }}
          >
            <MedicalServicesIcon />
          </Box>

          <Box>
            <Typography variant="h6">
              {mode === "create" ? "Thêm dịch vụ" : "Chỉnh sửa dịch vụ"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Thiết lập thông tin cơ bản của dịch vụ massage
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            position: "absolute",

            top: 12,
            right: 12,
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

            <RHFTextField<FormValues>
              name="name"
              label="Tên dịch vụ"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập tên dịch vụ",

                minLength: {
                  value: 2,

                  message: "Tên dịch vụ phải có ít nhất 2 ký tự",
                },
              }}
            />

            <RHFTextField<FormValues>
              name="slug"
              label="Slug"
              placeholder="massage-body"
              fullWidth
              disabled={isSubmitting}
              helperText={
                mode === "create"
                  ? "Có thể để trống để hệ thống tự tạo"
                  : "Slug dùng làm mã định danh của dịch vụ"
              }
              rules={{
                validate: (value) => {
                  const slug = value.toString().trim();

                  if (!slug) {
                    return true;
                  }

                  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                    return "Slug chỉ gồm chữ thường, số và dấu gạch ngang";
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
              <RHFTextField<FormValues>
                name="description"
                label="Mô tả"
                fullWidth
                multiline
                minRows={4}
                disabled={isSubmitting}
              />
            </Box>

            <RHFTextField<FormValues>
              name="imageUrl"
              label="URL hình ảnh"
              fullWidth
              disabled={isSubmitting}
            />

            <RHFTextField<FormValues>
              name="sortOrder"
              label="Thứ tự hiển thị"
              type="number"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập thứ tự",

                validate: (value) => {
                  const number = Number(value);

                  if (!Number.isInteger(number) || number < 0) {
                    return "Thứ tự phải là số nguyên từ 0";
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
          <Button color="inherit" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              minWidth: 120,
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : mode === "create" ? (
              "Tạo dịch vụ"
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogActions>
      </RHFFormProvider>
    </Dialog>
  );
}
