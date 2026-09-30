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

import CloseIcon from "@mui/icons-material/Close";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import {
  createPromotion,
  PromotionAudience,
  PromotionItem,
  PromotionRewardRecipient,
  PromotionRewardType,
  PromotionTriggerType,
  updatePromotion,
} from "@/lib/promotions";

import { getVouchers, VoucherItem } from "@/lib/vouchers";

interface TranslationFormValue {
  locale: string;
  name: string;
  description: string;
}

interface FormValues {
  code: string;

  audience: PromotionAudience;

  triggerType: PromotionTriggerType;

  rewardType: PromotionRewardType;

  rewardRecipient: PromotionRewardRecipient;

  rewardValue: string;

  voucherId: string;

  startsAt: string;

  endsAt: string;

  usageLimit: string;

  usageLimitPerUser: string;

  isActive: boolean;

  translations: TranslationFormValue[];
}

interface Props {
  open: boolean;

  mode: "create" | "edit";

  promotion?: PromotionItem | null;

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

export function PromotionDialog({
  open,
  mode,
  promotion,
  onClose,
  onSuccess,
}: Props) {
  const router = useRouter();

  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [serverError, setServerError] = useState("");

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);

  const [voucherLoading, setVoucherLoading] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      code: "",

      audience: "client",

      triggerType: "referral_code_entered",

      rewardType: "voucher",

      rewardRecipient: "actor",

      rewardValue: "0",

      voucherId: "",

      startsAt: "",

      endsAt: "",

      usageLimit: "",

      usageLimitPerUser: "1",

      isActive: true,

      translations: [
        {
          locale: "vi",
          name: "",
          description: "",
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

  const rewardType = useWatch({
    control,
    name: "rewardType",
  });

  const audience = useWatch({
    control,
    name: "audience",
  });

  const triggerType = useWatch({
    control,
    name: "triggerType",
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

    if (mode === "edit" && promotion) {
      reset({
        code: promotion.code,

        audience: promotion.audience,

        triggerType: promotion.triggerType,

        rewardType: promotion.rewardType,

        rewardRecipient: promotion.rewardRecipient,

        rewardValue: String(promotion.rewardValue ?? 0),

        voucherId:
          promotion.voucherId !== null ? String(promotion.voucherId) : "",

        startsAt: toDateTimeLocal(promotion.startsAt),

        endsAt: toDateTimeLocal(promotion.endsAt),

        usageLimit:
          promotion.usageLimit !== null ? String(promotion.usageLimit) : "",

        usageLimitPerUser:
          promotion.usageLimitPerUser !== null
            ? String(promotion.usageLimitPerUser)
            : "",

        isActive: promotion.isActive,

        translations:
          promotion.translations.length > 0
            ? promotion.translations.map((translation) => ({
                locale: translation.locale,

                name: translation.name,

                description: translation.description ?? "",
              }))
            : [
                {
                  locale: "vi",
                  name: "",
                  description: "",
                },
              ],
      });

      return;
    }

    reset({
      code: "",

      audience: "client",

      triggerType: "referral_code_entered",

      rewardType: "voucher",

      rewardRecipient: "actor",

      rewardValue: "0",

      voucherId: "",

      startsAt: "",

      endsAt: "",

      usageLimit: "",

      usageLimitPerUser: "1",

      isActive: true,

      translations: [
        {
          locale: "vi",
          name: "",
          description: "",
        },
      ],
    });
  }, [open, mode, promotion, reset]);

  useEffect(() => {
    if (!open || rewardType !== "voucher") {
      return;
    }

    let cancelled = false;

    const loadVouchers = async () => {
      try {
        setVoucherLoading(true);

        const response = await getVouchers({
          page: 1,
          limit: 100,
          audience,
          isActive: true,
        });

        if (cancelled) {
          return;
        }

        setVouchers(response.items);

        const selectedVoucherId = methods.getValues("voucherId");

        if (
          selectedVoucherId &&
          !response.items.some((item) => String(item.id) === selectedVoucherId)
        ) {
          setValue("voucherId", "");
        }
      } catch (error) {
        if (!cancelled) {
          setVouchers([]);

          setServerError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách voucher"
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
  }, [open, rewardType, audience, methods, setValue]);

  useEffect(() => {
    if (rewardType === "wallet_credit") {
      setValue("voucherId", "");
    }

    if (rewardType === "voucher") {
      setValue("rewardValue", "0");
    }
  }, [rewardType, setValue]);

  const submit = async (values: FormValues) => {
    try {
      setServerError("");

      const translations = values.translations
        .map((translation) => ({
          locale: translation.locale.trim(),

          name: translation.name.trim(),

          description: translation.description.trim() || null,
        }))
        .filter(
          (translation) =>
            translation.locale.length > 0 || translation.name.length > 0
        );

      if (!translations.length) {
        setServerError("Promotion phải có ít nhất một bản dịch");

        return;
      }

      const localeSet = new Set(
        translations.map((translation) => translation.locale.toLowerCase())
      );

      if (localeSet.size !== translations.length) {
        setServerError("Không được khai báo trùng locale");

        return;
      }

      if (values.rewardType === "voucher" && !values.voucherId) {
        setServerError("Vui lòng chọn voucher được cấp");

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

      const payload = {
        code: values.code.trim(),

        audience: values.audience,

        triggerType: values.triggerType,

        rewardType: values.rewardType,

        rewardRecipient: values.rewardRecipient,

        rewardValue:
          values.rewardType === "wallet_credit"
            ? Number(values.rewardValue)
            : 0,

        voucherId:
          values.rewardType === "voucher" ? Number(values.voucherId) : null,

        startsAt,

        endsAt,

        usageLimit: values.usageLimit.trim() ? Number(values.usageLimit) : null,

        usageLimitPerUser: values.usageLimitPerUser.trim()
          ? Number(values.usageLimitPerUser)
          : null,

        isActive: values.isActive,

        translations,
      };

      if (mode === "create") {
        await createPromotion(payload);
      } else {
        if (!promotion) {
          return;
        }

        await updatePromotion(promotion.id, payload);
      }

      onSuccess();

      onClose();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Không thể lưu promotion"
      );
    }
  };

  const goToVoucher = () => {
    onClose();

    router.push("/vouchers");
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="lg"
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              bgcolor: "#E6F7F5",
              color: "primary.main",
            }}
          >
            <LocalOfferIcon />
          </Box>

          <Box>
            <Typography variant="h6">
              {mode === "create"
                ? "Thêm chương trình khuyến mãi"
                : "Chỉnh sửa chương trình khuyến mãi"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Thiết lập điều kiện kích hoạt và phần thưởng của chương trình
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
                Thông tin chương trình
              </Typography>
            </Box>

            <RHFTextField<FormValues>
              name="code"
              label="Mã chương trình"
              placeholder="WELCOME_CLIENT"
              fullWidth
              disabled={isSubmitting}
              rules={{
                required: "Vui lòng nhập mã chương trình",
              }}
            />

            <RHFTextField<FormValues>
              name="audience"
              label="Đối tượng"
              select
              fullWidth
              disabled={isSubmitting}
            >
              <MenuItem value="client">Khách hàng</MenuItem>

              <MenuItem value="therapist">Kỹ thuật viên</MenuItem>
            </RHFTextField>

            <RHFTextField<FormValues>
              name="triggerType"
              label="Điều kiện kích hoạt"
              select
              fullWidth
              disabled={isSubmitting}
            >
              <MenuItem value="referral_code_entered">
                Nhập mã giới thiệu
              </MenuItem>

              <MenuItem value="referral_qualified">
                Giới thiệu đạt điều kiện
              </MenuItem>

              <MenuItem value="first_booking_eligible">
                Đủ điều kiện booking đầu tiên
              </MenuItem>

              <MenuItem value="first_booking_completed">
                Hoàn thành booking đầu tiên
              </MenuItem>
            </RHFTextField>

            <RHFTextField<FormValues>
              name="rewardRecipient"
              label="Người nhận thưởng"
              select
              fullWidth
              disabled={isSubmitting}
            >
              <MenuItem value="actor">Người thực hiện hành động</MenuItem>

              <MenuItem value="referrer">Người giới thiệu</MenuItem>
            </RHFTextField>

            {audience === "client" &&
              triggerType === "first_booking_eligible" && (
                <Alert
                  severity="info"
                  sx={{
                    gridColumn: "1 / -1",
                  }}
                >
                  Chương trình này có thể dùng để cấp voucher cho khách hàng
                  trước booking đầu tiên.
                </Alert>
              )}

            <Divider
              sx={{
                gridColumn: "1 / -1",
                my: 1,
              }}
            />

            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Phần thưởng
              </Typography>
            </Box>

            <RHFTextField<FormValues>
              name="rewardType"
              label="Loại phần thưởng"
              select
              fullWidth
              disabled={isSubmitting}
            >
              <MenuItem value="wallet_credit">Cộng ví khuyến mãi</MenuItem>

              <MenuItem value="voucher">Cấp voucher</MenuItem>
            </RHFTextField>

            {rewardType === "wallet_credit" ? (
              <RHFTextField<FormValues>
                name="rewardValue"
                label="Số tiền thưởng"
                type="number"
                fullWidth
                disabled={isSubmitting}
                rules={{
                  required: "Vui lòng nhập số tiền thưởng",

                  validate: (value) => {
                    const amount = Number(value);

                    return (
                      (Number.isFinite(amount) && amount > 0) ||
                      "Số tiền thưởng phải lớn hơn 0"
                    );
                  },
                }}
              />
            ) : (
              <Box>
                {voucherLoading ? (
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
                      Đang tải voucher...
                    </Typography>
                  </Box>
                ) : vouchers.length > 0 ? (
                  <RHFTextField<FormValues>
                    name="voucherId"
                    label="Voucher được cấp"
                    select
                    fullWidth
                    disabled={isSubmitting}
                    rules={{
                      required: "Vui lòng chọn voucher",
                    }}
                    helperText={`Chỉ hiển thị voucher đang hoạt động dành cho ${
                      audience === "client" ? "khách hàng" : "kỹ thuật viên"
                    }`}
                  >
                    {vouchers.map((voucher) => (
                      <MenuItem key={voucher.id} value={String(voucher.id)}>
                        {getVoucherName(voucher)}
                      </MenuItem>
                    ))}
                  </RHFTextField>
                ) : (
                  <Alert
                    severity="warning"
                    action={
                      <Button
                        size="small"
                        color="inherit"
                        endIcon={<OpenInNewIcon fontSize="small" />}
                        onClick={goToVoucher}
                      >
                        Tạo voucher
                      </Button>
                    }
                  >
                    Chưa có voucher đang hoạt động dành cho{" "}
                    <strong>
                      {audience === "client" ? "khách hàng" : "kỹ thuật viên"}
                    </strong>
                    .
                  </Alert>
                )}
              </Box>
            )}

            <Divider
              sx={{
                gridColumn: "1 / -1",
                my: 1,
              }}
            />

            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Thời gian và giới hạn
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
              name="usageLimit"
              label="Giới hạn tổng lượt"
              type="number"
              fullWidth
              disabled={isSubmitting}
              helperText="Để trống nếu không giới hạn"
              rules={{
                validate: (value: any) => {
                  if (!value.trim()) {
                    return true;
                  }

                  const number = Number(value);

                  return (
                    (Number.isInteger(number) && number > 0) ||
                    "Phải là số nguyên lớn hơn 0"
                  );
                },
              }}
            />

            <RHFTextField<FormValues>
              name="usageLimitPerUser"
              label="Giới hạn mỗi người dùng"
              type="number"
              fullWidth
              disabled={isSubmitting}
              helperText="Thông thường đặt 1 cho ưu đãi một lần"
              rules={{
                validate: (value: any) => {
                  if (!value.trim()) {
                    return true;
                  }

                  const number = Number(value);

                  return (
                    (Number.isInteger(number) && number > 0) ||
                    "Phải là số nguyên lớn hơn 0"
                  );
                },
              }}
            />

            <Box sx={{ gridColumn: "1 / -1" }}>
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

            <Divider
              sx={{
                gridColumn: "1 / -1",
                my: 1,
              }}
            />

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
                  Promotion phải có ít nhất một bản dịch.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                disabled={isSubmitting}
                onClick={() =>
                  appendTranslation({
                    locale: "",
                    name: "",
                    description: "",
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Bản dịch {index + 1}
                  </Typography>

                  {translationFields.length > 1 && (
                    <IconButton
                      color="error"
                      size="small"
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
                    }}
                  />

                  <RHFTextField<FormValues>
                    name={`translations.${index}.name`}
                    label="Tên chương trình"
                    fullWidth
                    disabled={isSubmitting}
                    rules={{
                      required: "Vui lòng nhập tên chương trình",
                    }}
                  />

                  <Box
                    sx={{
                      gridColumn: {
                        xs: "auto",
                        md: "1 / -1",
                      },
                    }}
                  >
                    <RHFTextField<FormValues>
                      name={`translations.${index}.description`}
                      label="Mô tả"
                      multiline
                      minRows={3}
                      fullWidth
                      disabled={isSubmitting}
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
            disabled={
              isSubmitting ||
              (rewardType === "voucher" && vouchers.length === 0)
            }
            sx={{ minWidth: 150 }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : mode === "create" ? (
              "Tạo chương trình"
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogActions>
      </RHFFormProvider>
    </Dialog>
  );
}
