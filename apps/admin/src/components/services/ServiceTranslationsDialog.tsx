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
  useMediaQuery,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import LanguageIcon from "@mui/icons-material/Language";

import { useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { RHFFormProvider, RHFTextField } from "@/components/form";

import { AdminLanguageItem, getAdminLanguages } from "@/lib/languages";

import {
  getServiceTranslations,
  MassageServiceItem,
  saveServiceTranslation,
  ServiceTranslationItem,
} from "@/lib/services";

interface FormValues {
  name: string;
  description: string;
}

interface Props {
  open: boolean;
  service: MassageServiceItem | null;
  onClose: () => void;
}

export function ServiceTranslationsDialog({ open, service, onClose }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [languages, setLanguages] = useState<AdminLanguageItem[]>([]);
  const [translations, setTranslations] = useState<ServiceTranslationItem[]>(
    []
  );

  const [selectedLocale, setSelectedLocale] = useState("");

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const methods = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
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
    if (!service) {
      return;
    }

    try {
      setLoading(true);
      setServerError("");

      const [languageItems, translationItems] = await Promise.all([
        getAdminLanguages(),
        getServiceTranslations(service.id),
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
  }, [service]);

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
      name: translation?.name ?? "",
      description: translation?.description ?? "",
    });
  }, [open, selectedLocale, translations, reset]);

  const submit = async (values: FormValues) => {
    if (!service || !selectedLocale) {
      return;
    }

    try {
      setServerError("");

      const saved = await saveServiceTranslation(service.id, selectedLocale, {
        name: values.name.trim(),
        description: values.description.trim() || null,
      });

      setTranslations((current) => {
        const exists = current.some((item) => item.id === saved.id);

        if (exists) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }

        return [...current, saved];
      });

      reset({
        name: saved.name,
        description: saved.description ?? "",
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
              bgcolor: "action.hover",
              color: "primary.main",
            }}
          >
            <LanguageIcon />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Bản dịch dịch vụ
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {service?.name ?? ""}
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
                minHeight: 260,
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
                gap: 3,
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
                    mb: 1,
                    fontWeight: 700,
                  }}
                >
                  Nội dung mặc định / fallback
                </Typography>

                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {service?.name}
                </Typography>

                {service?.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {service.description}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(240px, 320px) 1fr",
                  },
                  gap: 3,
                }}
              >
                <Box>
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
                        mt: 1.5,
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
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <RHFTextField<FormValues>
                    name="name"
                    label="Tên dịch vụ"
                    fullWidth
                    disabled={isSubmitting || !selectedLocale}
                    rules={{
                      required: "Vui lòng nhập tên dịch vụ",
                      validate: (value) =>
                        value.trim().length > 0 || "Vui lòng nhập tên dịch vụ",
                    }}
                  />

                  <RHFTextField<FormValues>
                    name="description"
                    label="Mô tả"
                    fullWidth
                    multiline
                    minRows={5}
                    disabled={isSubmitting || !selectedLocale}
                  />
                </Box>
              </Box>
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
            sx={{
              minWidth: 120,
            }}
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
