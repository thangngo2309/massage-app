"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import SpaIcon from "@mui/icons-material/Spa";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { RHFFormProvider, RHFTextField } from "@/components/form";
import { ApiError, apiRequest } from "@/lib/api";
import { clearAuth, isAdminRole, LoginResponse, saveAuth } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

interface LoginFormValues {
  login: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();

  const status = useAuthStore((state) => state.status);

  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const methods = useForm<LoginFormValues>({
    defaultValues: {
      login: "",
      password: "",
    },

    mode: "onSubmit",
  });

  const {
    handleSubmit,
    setError,

    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      clearAuth();

      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",

        body: JSON.stringify({
          login: values.login.trim(),

          password: values.password,

          deviceName: "Admin Web",
        }),
      });

      if (!isAdminRole(response.user.role)) {
        clearAuth();

        setError("root", {
          type: "manual",

          message: "Tài khoản không có quyền truy cập trang quản trị",
        });

        return;
      }

      saveAuth(response);

      setAuthenticated(response.user);

      router.replace("/dashboard");
    } catch (error) {
      setError("root", {
        type: "server",

        message:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Không thể đăng nhập. Vui lòng thử lại.",
      });
    }
  };

  if (status === "loading") {
    return (
      <Box
        sx={{
          minHeight: "100dvh",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",

        display: "flex",

        alignItems: "center",

        background:
          "linear-gradient(135deg, #ECFDF5 0%, #F4F7F9 45%, #EEF2FF 100%)",
      }}
    >
      <Container maxWidth="xs">
        <Paper
          sx={{
            p: {
              xs: 3,
              sm: 4,
            },

            boxShadow: "0 20px 50px rgba(15, 23, 42, .08)",
          }}
        >
          <Stack spacing={3}>
            <Box
              sx={{
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,

                  mx: "auto",
                  mb: 2,

                  borderRadius: 3,

                  bgcolor: "primary.main",

                  color: "primary.contrastText",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",
                }}
              >
                <SpaIcon
                  sx={{
                    fontSize: 32,
                  }}
                />
              </Box>

              <Typography variant="h5">Massage Admin</Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.8,
                }}
              >
                Đăng nhập hệ thống quản trị
              </Typography>
            </Box>

            {errors.root?.message && (
              <Alert severity="error">{errors.root.message}</Alert>
            )}

            <RHFFormProvider
              methods={methods}
              onSubmit={handleSubmit(onSubmit)}
            >
              <Stack spacing={2}>
                <RHFTextField<LoginFormValues>
                  name="login"
                  label="Email hoặc số điện thoại"
                  fullWidth
                  autoFocus
                  disabled={isSubmitting}
                  rules={{
                    required: "Vui lòng nhập email hoặc số điện thoại",
                  }}
                />

                <RHFTextField<LoginFormValues>
                  name="password"
                  label="Mật khẩu"
                  type="password"
                  fullWidth
                  disabled={isSubmitting}
                  rules={{
                    required: "Vui lòng nhập mật khẩu",

                    minLength: {
                      value: 8,

                      message: "Mật khẩu phải có ít nhất 8 ký tự",
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    height: 48,
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </Stack>
            </RHFFormProvider>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
