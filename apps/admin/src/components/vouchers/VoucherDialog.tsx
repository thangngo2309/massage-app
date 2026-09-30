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
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import { useEffect, useState } from "react";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createVoucher,
  updateVoucher,
  VoucherAudience,
  VoucherDiscountType,
  VoucherItem,
} from "@/lib/vouchers";

interface TranslationFormValue {
  locale: string;
  name: string;
  description: string;
  terms: string;
}

interface FormValues {
  code: string;

  audience: VoucherAudience;

  discountType: VoucherDiscountType;

  discountValue: string;

  maxDiscountAmount: string;

  minOrderAmount: string;

  startsAt: string;

  endsAt: string;

  issuanceLimit: string;

  isActive: boolean;

  translations: TranslationFormValue[];
}

interface Props {
  open: boolean;

  mode: "create" | "edit";

  voucher?: VoucherItem | null;

  onClose: () => void;

  onSuccess: () => void;
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDate(value: string) {
  if (!value.trim()) {
    return null;
  }

  return new Date(value).toISOString();
}

export function VoucherDialog({
  open,
  mode,
  voucher,
  onClose,
  onSuccess,
}: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [serverError, setServerError] = useState("");

  const methods = useForm<FormValues>({
    defaultValues: {
      code: "",
      audience: "client",
      discountType: "fixed",
      discountValue: "",
      maxDiscountAmount: "",
      minOrderAmount: "0",
      startsAt: "",
      endsAt: "",
      issuanceLimit: "",
      isActive: true,

      translations: [
        {
          locale: "vi",
          name: "",
          description: "",
          terms: "",
        },
      ],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,

    formState: { isSubmitting },
  } = methods;

  const discountType = useWatch({
    control,
    name: "discountType",
  });

  const {
    fields: translationFields,
    append: appendTranslation,
    remove: removeTranslation,
  } = useFieldArray({
    control,
    name: "translations",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setServerError("");

    if (mode === "edit" && voucher) {
      reset({
        code: voucher.code,

        audience: voucher.audience,

        discountType: voucher.discountType,

        discountValue: String(voucher.discountValue),

        maxDiscountAmount:
          voucher.maxDiscountAmount !== null
            ? String(voucher.maxDiscountAmount)
            : "",

        minOrderAmount: String(voucher.minOrderAmount ?? 0),

        startsAt: toDateTimeLocal(voucher.startsAt),

        endsAt: toDateTimeLocal(voucher.endsAt),

        issuanceLimit:
          voucher.issuanceLimit !== null ? String(voucher.issuanceLimit) : "",

        isActive: voucher.isActive,

        translations:
          voucher.translations.length > 0
            ? voucher.translations.map((translation) => ({
                locale: translation.locale,

                name: translation.name,

                description: translation.description ?? "",

                terms: translation.terms ?? "",
              }))
            : [
                {
                  locale: "vi",
                  name: "",
                  description: "",
                  terms: "",
                },
              ],
      });

      return;
    }

    reset({
      code: "",
      audience: "client",
      discountType: "fixed",
      discountValue: "",
      maxDiscountAmount: "",
      minOrderAmount: "0",
      startsAt: "",
      endsAt: "",
      issuanceLimit: "",
      isActive: true,

      translations: [
        {
          locale: "vi",
          name: "",
          description: "",
          terms: "",
        },
      ],
    });
  }, [open, mode, voucher, reset]);

  useEffect(() => {
    if (discountType === "fixed") {
      setValue("maxDiscountAmount", "");
    }
  }, [discountType, setValue]);

  const submit = async (values: FormValues) => {
    try {
      setServerError("");

      const discountValue = Number(values.discountValue);

      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        setServerError("Giá trị giảm giá phải lớn hơn 0");

        return;
      }

      if (values.discountType === "percent" && discountValue > 100) {
        setServerError("Giảm giá phần trăm không được lớn hơn 100%");

        return;
      }

      const startsAt = toIsoDate(values.startsAt);

      const endsAt = toIsoDate(values.endsAt);

      if (
        startsAt &&
        endsAt &&
        new Date(endsAt).getTime() <= new Date(startsAt).getTime()
      ) {
        setServerError("Thời gian kết thúc phải sau thời gian bắt đầu");

        return;
      }

      const translations = values.translations
        .map((translation) => ({
          locale: translation.locale.trim(),

          name: translation.name.trim(),

          description: translation.description.trim() || null,

          terms: translation.terms.trim() || null,
        }))
        .filter(
          (translation) =>
            translation.locale.length > 0 || translation.name.length > 0
        );

      if (!translations.length) {
        setServerError("Voucher phải có ít nhất một bản dịch");

        return;
      }

      const locales = translations.map((translation) =>
        translation.locale.toLowerCase()
      );

      if (new Set(locales).size !== locales.length) {
        setServerError("Không được khai báo trùng locale");

        return;
      }

      const payload = {
        code: values.code.trim(),

        audience: values.audience,

        discountType: values.discountType,

        discountValue,

        maxDiscountAmount:
          values.discountType === "percent" && values.maxDiscountAmount.trim()
            ? Number(values.maxDiscountAmount)
            : null,

        minOrderAmount: values.minOrderAmount.trim()
          ? Number(values.minOrderAmount)
          : 0,

        startsAt,

        endsAt,

        issuanceLimit: values.issuanceLimit.trim()
          ? Number(values.issuanceLimit)
          : null,

        isActive: values.isActive,

        translations,
      };

      if (mode === "create") {
        await createVoucher(payload);
      } else {
        if (!voucher) {
          return;
        }

        await updateVoucher(voucher.id, payload);
      }

      onSuccess();

      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Không thể lưu voucher"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="lg"
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
            <ConfirmationNumberIcon />
          </Box>

          <Box>
            <Typography variant="h6">
              {mode === "create" ? "Thêm voucher" : "Chỉnh sửa voucher"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Thiết lập giá trị ưu đãi và điều kiện sử dụng voucher
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
                md: "repeat(2, minmax(0, 1fr))",
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

            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Thông tin voucher
              </Typography>
            </Box>

            <RHFTextField<FormValues>
              name="code"
              label="Mã voucher"
              placeholder="WELCOME50K"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập mã voucher",

                maxLength: {
                  value: 100,
                  message: "Mã voucher tối đa 100 ký tự",
                },
              }}
            />

            <RHFTextField<FormValues>
              name="audience"
              label="Đối tượng"
              select
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng chọn đối tượng",
              }}
            >
              <MenuItem value="client">Khách hàng</MenuItem>

              <MenuItem value="therapist">Kỹ thuật viên</MenuItem>
            </RHFTextField>

            <RHFTextField<FormValues>
              name="discountType"
              label="Loại giảm giá"
              select
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng chọn loại giảm giá",
              }}
            >
              <MenuItem value="fixed">Giảm số tiền cố định</MenuItem>

              <MenuItem value="percent">Giảm theo phần trăm</MenuItem>
            </RHFTextField>

            <RHFTextField<FormValues>
              name="discountValue"
              label={
                discountType === "percent" ? "Phần trăm giảm" : "Số tiền giảm"
              }
              type="number"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập giá trị giảm",

                validate: (value) => {
                  const number = Number(value);

                  if (!Number.isFinite(number) || number <= 0) {
                    return "Giá trị phải lớn hơn 0";
                  }

                  if (discountType === "percent" && number > 100) {
                    return "Phần trăm không được lớn hơn 100";
                  }

                  return true;
                },
              }}
              slotProps={{
                htmlInput: {
                  min: 0.01,
                  step: discountType === "percent" ? 1 : 1000,
                },
              }}
              helperText={
                discountType === "percent"
                  ? "Ví dụ: 10 tương ứng giảm 10%"
                  : "Đơn vị: VNĐ"
              }
            />

            {discountType === "percent" && (
              <RHFTextField<FormValues>
                name="maxDiscountAmount"
                label="Giảm tối đa"
                type="number"
                fullWidth
                disabled={isSubmitting}
                helperText="Để trống nếu không giới hạn số tiền giảm tối đa"
                rules={{
                  validate: (value: any) => {
                    if (!value.trim()) {
                      return true;
                    }

                    const number = Number(value);

                    return (
                      (Number.isFinite(number) && number > 0) ||
                      "Giá trị phải lớn hơn 0"
                    );
                  },
                }}
                slotProps={{
                  htmlInput: {
                    min: 0.01,
                    step: 1000,
                  },
                }}
              />
            )}

            <RHFTextField<FormValues>
              name="minOrderAmount"
              label="Giá trị booking tối thiểu"
              type="number"
              fullWidth
              disabled={isSubmitting}
              helperText="Nhập 0 nếu không yêu cầu giá trị tối thiểu"
              rules={{
                validate: (value: any) => {
                  if (!value.trim()) {
                    return true;
                  }

                  const number = Number(value);

                  return (
                    (Number.isFinite(number) && number >= 0) ||
                    "Giá trị phải lớn hơn hoặc bằng 0"
                  );
                },
              }}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1000,
                },
              }}
            />

            <Divider sx={{ gridColumn: "1 / -1", my: 1 }} />

            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Thời gian và số lượng phát hành
              </Typography>
            </Box>

            <RHFTextField<FormValues>
              name="startsAt"
              label="Bắt đầu"
              type="datetime-local"
              fullWidth
              disabled={isSubmitting}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <RHFTextField<FormValues>
              name="endsAt"
              label="Kết thúc"
              type="datetime-local"
              fullWidth
              disabled={isSubmitting}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <RHFTextField<FormValues>
              name="issuanceLimit"
              label="Giới hạn phát hành"
              type="number"
              fullWidth
              disabled={isSubmitting}
              helperText="Để trống nếu không giới hạn số voucher được cấp"
              rules={{
                validate: (value: any) => {
                  if (!value.trim()) {
                    return true;
                  }

                  const number = Number(value);

                  return (
                    (Number.isInteger(number) && number >= 1) ||
                    "Phải là số nguyên lớn hơn hoặc bằng 1"
                  );
                },
              }}
              slotProps={{
                htmlInput: {
                  min: 1,
                },
              }}
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
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
                        disabled={isSubmitting}
                      />
                    }
                  />
                )}
              />
            </Box>

            <Divider sx={{ gridColumn: "1 / -1", my: 1 }} />

            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Nội dung đa ngôn ngữ
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Tên, mô tả và điều khoản sử dụng voucher.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                disabled={isSubmitting || translationFields.length >= 20}
                onClick={() =>
                  appendTranslation({
                    locale: "",
                    name: "",
                    description: "",
                    terms: "",
                  })
                }
              >
                Thêm ngôn ngữ
              </Button>
            </Box>

            {translationFields.map((field, index) => (
              <Box
                key={field.id}
                sx={{
                  gridColumn: "1 / -1",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Bản dịch {index + 1}
                  </Typography>

                  {translationFields.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      disabled={isSubmitting}
                      onClick={() => removeTranslation(index)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  )}
                </Box>

                <Box
                  sx={{
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "180px minmax(0, 1fr)",
                    },

                    gap: 2,
                  }}
                >
                  <RHFTextField<FormValues>
                    name={`translations.${index}.locale`}
                    label="Locale"
                    placeholder="vi"
                    fullWidth
                    disabled={isSubmitting}
                    rules={{
                      required: "Vui lòng nhập locale",

                      minLength: {
                        value: 2,
                        message: "Locale tối thiểu 2 ký tự",
                      },

                      maxLength: {
                        value: 20,
                        message: "Locale tối đa 20 ký tự",
                      },
                    }}
                  />

                  <RHFTextField<FormValues>
                    name={`translations.${index}.name`}
                    label="Tên voucher"
                    fullWidth
                    disabled={isSubmitting}
                    rules={{
                      required: "Vui lòng nhập tên voucher",

                      maxLength: {
                        value: 255,
                        message: "Tên tối đa 255 ký tự",
                      },
                    }}
                  />

                  <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
                    <RHFTextField<FormValues>
                      name={`translations.${index}.description`}
                      label="Mô tả"
                      multiline
                      minRows={3}
                      fullWidth
                      disabled={isSubmitting}
                      rules={{
                        maxLength: {
                          value: 5000,
                          message: "Mô tả tối đa 5.000 ký tự",
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
                    <RHFTextField<FormValues>
                      name={`translations.${index}.terms`}
                      label="Điều khoản sử dụng"
                      multiline
                      minRows={4}
                      fullWidth
                      disabled={isSubmitting}
                      rules={{
                        maxLength: {
                          value: 10000,
                          message: "Điều khoản tối đa 10.000 ký tự",
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
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
              minWidth: 130,
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : mode === "create" ? (
              "Tạo voucher"
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogActions>
      </RHFFormProvider>
    </Dialog>
  );
}
