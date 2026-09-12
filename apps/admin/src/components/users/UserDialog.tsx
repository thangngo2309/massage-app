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
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EditIcon from "@mui/icons-material/Edit";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTheme } from "@mui/material/styles";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import type { AuthUser, UserRole } from "@/lib/auth";

import { createUser, updateUser } from "@/lib/users";

import { useAuthStore } from "@/store/authStore";

interface UserFormValues {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole | "";
}

interface Props {
  open: boolean;

  mode: "create" | "edit";

  user?: AuthUser | null;

  onClose: () => void;

  onSuccess: () => void;
}

export function UserDialog({ open, mode, user, onClose, onSuccess }: Props) {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const currentUser = useAuthStore((state) => state.user);

  const [serverError, setServerError] = useState("");

  const roleOptions = useMemo(() => {
    if (currentUser?.role === "super_admin") {
      return [
        {
          value: "system_admin" as UserRole,

          label: "System Admin",
        },

        {
          value: "client" as UserRole,

          label: "Khách hàng",
        },

        {
          value: "therapist" as UserRole,

          label: "Kỹ thuật viên",
        },
      ];
    }

    return [
      {
        value: "client" as UserRole,

        label: "Khách hàng",
      },

      {
        value: "therapist" as UserRole,

        label: "Kỹ thuật viên",
      },
    ];
  }, [currentUser?.role]);

  const methods = useForm<UserFormValues>({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      role: "",
    },

    mode: "onSubmit",
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

    if (mode === "edit" && user) {
      reset({
        fullName: user.fullName,

        phone: user.phone,

        email: user.email ?? "",

        password: "",

        role: user.role,
      });

      return;
    }

    reset({
      fullName: "",
      phone: "",
      email: "",
      password: "",

      role: currentUser?.role === "super_admin" ? "client" : "client",
    });
  }, [open, mode, user, reset, currentUser?.role]);

  const submit = async (values: UserFormValues) => {
    try {
      setServerError("");

      if (!values.role) {
        return;
      }

      const fullName = values.fullName.trim();

      const phone = values.phone.trim();

      const email = values.email.trim();

      if (mode === "create") {
        await createUser({
          fullName,
          phone,

          ...(email
            ? {
                email,
              }
            : {}),

          password: values.password,

          role: values.role,
        });
      } else {
        if (!user) {
          return;
        }

        await updateUser(user.id, {
          fullName,

          phone,

          email: email || null,

          role: values.role,

          ...(values.password
            ? {
                password: values.password,
              }
            : {}),
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Không thể lưu thông tin người dùng"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
    >
      <DialogTitle
        sx={{
          pr: 7,
          pb: 1,
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

              borderRadius: 2,

              bgcolor: "#E6F7F5",

              color: "primary.main",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",
            }}
          >
            {mode === "create" ? <PersonAddAlt1Icon /> : <EditIcon />}
          </Box>

          <Box>
            <Typography variant="h6">
              {mode === "create" ? "Thêm người dùng" : "Chỉnh sửa người dùng"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {mode === "create"
                ? "Tạo tài khoản mới trong hệ thống"
                : `Cập nhật tài khoản #${user?.id ?? ""}`}
            </Typography>
          </Box>
        </Box>

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
              <RHFTextField<UserFormValues>
                name="fullName"
                label="Họ và tên"
                fullWidth
                disabled={isSubmitting}
                rules={{
                  required: "Vui lòng nhập họ tên",

                  minLength: {
                    value: 2,

                    message: "Họ tên phải có ít nhất 2 ký tự",
                  },

                  maxLength: {
                    value: 255,

                    message: "Họ tên không được vượt quá 255 ký tự",
                  },
                }}
              />
            </Box>

            <RHFTextField<UserFormValues>
              name="phone"
              label="Số điện thoại"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập số điện thoại",

                validate: (value) => {
                  const phone = value.trim().replace(/[\s.-]/g, "");

                  if (!/^(?:0|\+84)[35789]\d{8}$/.test(phone)) {
                    return "Số điện thoại không hợp lệ";
                  }

                  return true;
                },
              }}
            />

            <RHFTextField<UserFormValues>
              name="email"
              label="Email"
              type="email"
              fullWidth
              disabled={isSubmitting}
              rules={{
                validate: (value) => {
                  const email = value.trim();

                  if (!email) {
                    return true;
                  }

                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    return "Email không hợp lệ";
                  }

                  return true;
                },
              }}
            />

            <Box
              sx={{
                gridColumn: {
                  xs: "auto",
                  sm: "1 / -1",
                },
              }}
            >
              <Controller
                name="role"
                control={control}
                rules={{
                  required: "Vui lòng chọn vai trò",
                }}
                render={({ field, fieldState }) => (
                  <FormControl
                    fullWidth
                    error={!!fieldState.error}
                    disabled={isSubmitting}
                  >
                    <InputLabel>Vai trò</InputLabel>

                    <Select {...field} label="Vai trò">
                      {roleOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>

                    {fieldState.error && (
                      <FormHelperText>
                        {fieldState.error.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Box>

            <Box
              sx={{
                gridColumn: "1 / -1",
              }}
            >
              <RHFTextField<UserFormValues>
                name="password"
                label={mode === "create" ? "Mật khẩu" : "Mật khẩu mới"}
                type="password"
                fullWidth
                disabled={isSubmitting}
                autoComplete="new-password"
                helperText={
                  mode === "edit"
                    ? "Để trống nếu không muốn thay đổi mật khẩu"
                    : undefined
                }
                rules={{
                  required:
                    mode === "create" ? "Vui lòng nhập mật khẩu" : false,

                  validate: (value) => {
                    if (mode === "edit" && !value) {
                      return true;
                    }

                    if (value.length < 8) {
                      return "Mật khẩu phải có ít nhất 8 ký tự";
                    }

                    if (value.length > 72) {
                      return "Mật khẩu không được vượt quá 72 ký tự";
                    }

                    return true;
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },

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
              minWidth: 130,
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : mode === "create" ? (
              "Tạo tài khoản"
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogActions>
      </RHFFormProvider>
    </Dialog>
  );
}
