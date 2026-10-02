import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

const normalizeLocale = (locale?: string) => {
  const value = locale?.trim().toLowerCase();

  if (!value) {
    return "vi-VN";
  }

  if (value.startsWith("en")) {
    return "en-US";
  }

  if (value.startsWith("vi")) {
    return "vi-VN";
  }

  return locale ?? "vi-VN";
};

export const formatCurrency = (
  value: number | string | null | undefined,
  locale?: string
) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat(normalizeLocale(locale), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDuration = (
  minutes: number | null | undefined,
  locale?: string
) => {
  const value = Math.max(0, Math.floor(Number(minutes ?? 0)));

  const normalizedLocale = normalizeLocale(locale);

  const formatMinutes = (count: number) =>
    new Intl.NumberFormat(normalizedLocale, {
      style: "unit",
      unit: "minute",
      unitDisplay: "long",
    }).format(count);

  const formatHours = (count: number) =>
    new Intl.NumberFormat(normalizedLocale, {
      style: "unit",
      unit: "hour",
      unitDisplay: "long",
    }).format(count);

  if (value < 60) {
    return formatMinutes(value);
  }

  const hours = Math.floor(value / 60);

  const remainingMinutes = value % 60;

  if (!remainingMinutes) {
    return formatHours(hours);
  }

  return `${formatHours(hours)} ${formatMinutes(remainingMinutes)}`;
};

export const formatDate = (
  value: string | Date | null | undefined,
  locale?: string
) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (
  value: string | Date | null | undefined,
  locale?: string
) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatTime = (
  value: string | Date | null | undefined,
  locale?: string
) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
