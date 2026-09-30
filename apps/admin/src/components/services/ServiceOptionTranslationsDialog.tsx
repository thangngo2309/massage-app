"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import LanguageIcon from "@mui/icons-material/Language";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import { AdminLanguageItem, getAdminLanguages } from "@/lib/languages";

import {
  getServiceOptionTranslations,
  saveServiceOptionTranslation,
  ServiceOptionItem,
  ServiceOptionTranslationItem,
} from "@/lib/services";

interface FormValues {
  label: string;
}

interface Props {
  open: boolean;
  serviceId: number;
  option: ServiceOptionItem | null;
  onClose: () => void;
}

export function ServiceOptionTranslationsDialog({
  open,
  serviceId,
  option,
  onClose,
}: Props) {
  const [languages, setLanguages] = useState<AdminLanguageItem[]>([]);

  const [translations, setTranslations] = useState<
    ServiceOptionTranslationItem[]
  >([]);

  const [selectedLocale, setSelectedLocale] = useState("");

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const methods = useForm<FormValues>({
    defaultValues: {
      label: "",
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const selectedTranslation = useMemo(
    () =>
      translations.find(
        (translation) => translation.locale === selectedLocale
      ) ?? null,
    [translations, selectedLocale]
  );

  const selectedLanguage = useMemo(
    () =>
      languages.find((language) => language.code === selectedLocale) ?? null,
    [languages, selectedLocale]
  );

  const loadData = useCallback(async () => {
    if (!option) {
      return;
    }

    try {
      setLoading(true);
      setServerError("");

      const [languageItems, translationItems] = await Promise.all([
        getAdminLanguages(),
        getServiceOptionTranslations(serviceId, option.id),
      ]);

      setLanguages(languageItems);
      setTranslations(translationItems);

      const preferredLanguage =
        languageItems.find((language) => !language.isDefault) ??
        languageItems[0] ??
        null;

      setSelectedLocale((current) => {
        if (
          current &&
          languageItems.some((language) => language.code === current)
        ) {
          return current;
        }

        return preferredLanguage?.code ?? "";
      });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu bản dịch"
      );
    } finally {
      setLoading(false);
    }
  }, [serviceId, option]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadData();
  }, [open, loadData]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const translation =
      translations.find((item) => item.locale === selectedLocale) ?? null;

    reset({
      label: translation?.label ?? "",
    });
  }, [open, selectedLocale, translations, reset]);

  const submit = async (values: FormValues) => {
    if (!option || !selectedLocale) {
      return;
    }

    try {
      setServerError("");

      const saved = await saveServiceOptionTranslation(
        serviceId,
        option.id,
        selectedLocale,
        {
          label: values.label.trim(),
        }
      );

      setTranslations((current) => {
        const exists = current.some((item) => item.id === saved.id);

        if (exists) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }

        return [...current, saved];
      });

      reset({
        label: saved.label,
      });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Không thể lưu bản dịch"
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
              bgcolor: "action.hover",
              color: "primary.main",
            }}
          >
            <LanguageIcon />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Bản dịch gói dịch vụ
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {option?.label || `${option?.durationMinutes ?? 0} phút`}
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
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : languages.length === 0 ? (
            <Alert severity="warning">
              Chưa có ngôn ngữ đang hoạt động để cấu hình bản dịch.
            </Alert>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Nội dung mặc định / fallback
                </Typography>

                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {option?.label || `${option?.durationMinutes ?? 0} phút`}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Thời lượng: {option?.durationMinutes ?? 0} phút
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Ngôn ngữ</InputLabel>

                <Select
                  label="Ngôn ngữ"
                  value={selectedLocale}
                  onChange={(event) =>
                    setSelectedLocale(String(event.target.value))
                  }
                  disabled={isSubmitting}
                >
                  {languages.map((language) => {
                    const translated = translations.some(
                      (translation) => translation.locale === language.code
                    );

                    return (
                      <MenuItem key={language.code} value={language.code}>
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Box>
                            <Typography variant="body2">
                              {language.nativeName}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {language.name} · {language.code}
                            </Typography>
                          </Box>

                          {translated && (
                            <Chip
                              size="small"
                              label="Đã dịch"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {selectedLanguage && (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Chip
                    size="small"
                    label={selectedLanguage.code}
                    variant="outlined"
                  />

                  {selectedLanguage.isDefault && (
                    <Chip
                      size="small"
                      label="Ngôn ngữ mặc định"
                      color="primary"
                      variant="outlined"
                    />
                  )}

                  <Chip
                    size="small"
                    label={
                      selectedTranslation
                        ? "Đã có bản dịch"
                        : "Chưa có bản dịch"
                    }
                    color={selectedTranslation ? "success" : "default"}
                    variant="outlined"
                  />
                </Box>
              )}

              <RHFTextField<FormValues>
                name="label"
                label="Tên gói"
                fullWidth
                disabled={isSubmitting || !selectedLocale}
                rules={{
                  required: "Vui lòng nhập tên gói",
                  validate: (value) =>
                    value.trim().length > 0 || "Vui lòng nhập tên gói",
                }}
              />
            </Box>
          )}
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
            Đóng
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={
              isSubmitting ||
              loading ||
              !selectedLocale ||
              languages.length === 0
            }
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Lưu bản dịch"
            )}
          </Button>
        </DialogActions>
      </RHFFormProvider>
    </Dialog>
  );
}
