"use client";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";

import { Controller, useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  grantAdminUserVoucher,
  PromotionOperationsUserSummary,
} from "@/lib/promotion-operations";

import { getVouchers, VoucherItem } from "@/lib/vouchers";

import { getUsers } from "@/lib/users";

interface FormValues {
  userId: string;
  voucherId: string;
  expiresAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getVoucherName(voucher: VoucherItem) {
  const translation =
    voucher.translations.find((item) => item.locale.toLowerCase() === "vi") ??
    voucher.translations.find((item) =>
      item.locale.toLowerCase().startsWith("vi")
    ) ??
    voucher.translations[0];

  if (!translation?.name) {
    return voucher.code;
  }

  return `${voucher.code} - ${translation.name}`;
}

function getUserRoleLabel(role: string) {
  switch (role) {
    case "client":
      return "Khách hàng";

    case "therapist":
      return "Kỹ thuật viên";

    case "super_admin":
      return "Super Admin";

    case "system_admin":
      return "System Admin";

    default:
      return role;
  }
}

export function GrantUserVoucherDialog({ open, onClose, onSuccess }: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [serverError, setServerError] = useState("");

  const [users, setUsers] = useState<PromotionOperationsUserSummary[]>([]);

  const [selectedUser, setSelectedUser] =
    useState<PromotionOperationsUserSummary | null>(null);

  const [userInput, setUserInput] = useState("");

  const [userLoading, setUserLoading] = useState(false);

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);

  const [voucherLoading, setVoucherLoading] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      userId: "",
      voucherId: "",
      expiresAt: "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      userId: "",
      voucherId: "",
      expiresAt: "",
    });

    setSelectedUser(null);
    setUsers([]);
    setVouchers([]);
    setUserInput("");
    setServerError("");
  }, [open, reset]);

  const searchUsers = useCallback(async (q: string) => {
    try {
      setUserLoading(true);
      setServerError("");

      const response = await getUsers({
        page: 1,
        limit: 20,
        q: q.trim() || undefined,
        status: "active",
      });

      const supportedUsers = response.items.filter(
        (item) => item.role === "client" || item.role === "therapist"
      );

      const mappedUsers: PromotionOperationsUserSummary[] = supportedUsers.map(
        (item) => ({
          id: item.id,
          fullName: item.fullName,
          phone: item.phone,
          email: item.email ?? null,
          role: item.role,
          status: item.status as PromotionOperationsUserSummary["status"],
        })
      );

      setUsers(mappedUsers);
    } catch (error) {
      setUsers([]);

      setServerError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách người dùng"
      );
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void searchUsers(userInput);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open, searchUsers, userInput]);

  useEffect(() => {
    if (!open || !selectedUser) {
      setVouchers([]);
      setValue("voucherId", "");
      return;
    }

    let cancelled = false;

    const loadVouchers = async () => {
      try {
        setVoucherLoading(true);
        setServerError("");

        const response = await getVouchers({
          page: 1,
          limit: 100,

          audience: selectedUser.role === "client" ? "client" : "therapist",

          isActive: true,
        });

        if (cancelled) {
          return;
        }

        setVouchers(response.items);

        setValue("voucherId", "");
      } catch (error) {
        if (!cancelled) {
          setVouchers([]);

          setServerError(
            error instanceof Error ? error.message : "Không thể tải voucher"
          );
        }
      } finally {
        if (!cancelled) {
          setVoucherLoading(false);
        }
      }
    };

    void loadVouchers();

    return () => {
      cancelled = true;
    };
  }, [open, selectedUser, setValue]);

  const submit = async (values: FormValues) => {
    try {
      setServerError("");

      if (!selectedUser) {
        setServerError("Vui lòng chọn người dùng");
        return;
      }

      if (!values.voucherId) {
        setServerError("Vui lòng chọn voucher");
        return;
      }

      let expiresAt: string | undefined;

      if (values.expiresAt) {
        const expiresAtDate = new Date(values.expiresAt);

        if (Number.isNaN(expiresAtDate.getTime())) {
          setServerError("Thời hạn voucher không hợp lệ");

          return;
        }

        if (expiresAtDate.getTime() <= Date.now()) {
          setServerError("Thời hạn voucher phải ở tương lai");

          return;
        }

        expiresAt = expiresAtDate.toISOString();
      }

      await grantAdminUserVoucher({
        userId: selectedUser.id,
        voucherId: Number(values.voucherId),
        ...(expiresAt
          ? {
              expiresAt,
            }
          : {}),
      });

      onSuccess();

      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Không thể cấp voucher cho người dùng"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle component="div" sx={{ pr: 7 }}>
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
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardGiftcardIcon />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Cấp voucher cho người dùng
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Voucher được cấp thủ công bởi Admin.
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
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              pt: 1,
            }}
          >
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Controller
              name="userId"
              control={control}
              rules={{
                required: "Vui lòng chọn người dùng",
              }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  options={users}
                  value={selectedUser}
                  loading={userLoading}
                  loadingText="Đang tải người dùng..."
                  noOptionsText="Không tìm thấy người dùng"
                  filterOptions={(options) => options}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) =>
                    `${option.fullName} - ${option.phone}`
                  }
                  onInputChange={(_event, value, reason) => {
                    if (reason === "input") {
                      setUserInput(value);
                    }
                  }}
                  onChange={(_event, value) => {
                    setSelectedUser(value);

                    field.onChange(value ? String(value.id) : "");
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.fullName}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {option.phone} · {getUserRoleLabel(option.role)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Người dùng"
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ??
                        "Tìm theo tên hoặc số điện thoại"
                      }
                    />
                  )}
                />
              )}
            />

            {selectedUser && (
              <Alert severity="info">
                Đang cấp voucher cho <strong>{selectedUser.fullName}</strong> —{" "}
                {getUserRoleLabel(selectedUser.role)}
              </Alert>
            )}

            {selectedUser &&
              (voucherLoading ? (
                <Box
                  sx={{
                    minHeight: 56,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CircularProgress size={20} />

                  <Typography variant="body2" color="text.secondary">
                    Đang tải voucher phù hợp...
                  </Typography>
                </Box>
              ) : vouchers.length > 0 ? (
                <RHFTextField<FormValues>
                  name="voucherId"
                  label="Voucher"
                  select
                  fullWidth
                  disabled={isSubmitting}
                  rules={{
                    required: "Vui lòng chọn voucher",
                  }}
                  helperText="Chỉ hiển thị voucher đang hoạt động và đúng đối tượng"
                >
                  {vouchers.map((voucher) => (
                    <MenuItem key={voucher.id} value={String(voucher.id)}>
                      {getVoucherName(voucher)}
                    </MenuItem>
                  ))}
                </RHFTextField>
              ) : (
                <Alert severity="warning">
                  Không có voucher đang hoạt động phù hợp với người dùng này.
                </Alert>
              ))}

            <RHFTextField<FormValues>
              name="expiresAt"
              label="Thời hạn riêng"
              type="datetime-local"
              fullWidth
              disabled={isSubmitting}
              helperText="Để trống để sử dụng thời hạn của Voucher. Backend sẽ tự giới hạn không vượt quá ngày kết thúc của Voucher."
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
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
            disabled={
              isSubmitting ||
              !selectedUser ||
              voucherLoading ||
              vouchers.length === 0
            }
            sx={{ minWidth: 130 }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Cấp voucher"
            )}
          </Button>
        </DialogActions>
      </RHFFormProvider>
    </Dialog>
  );
}
