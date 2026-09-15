import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDuration = (minutes: number | null | undefined) => {
  const value = Number(minutes ?? 0);

  if (value < 60) {
    return `${value} phút`;
  }

  const hours = Math.floor(value / 60);
  const remaining = value % 60;

  if (!remaining) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${remaining} phút`;
};

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",
  }).format(date);
};

export const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",
  }).format(date);
};

export const formatTime = (value: string | Date | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",

    minute: "2-digit",
  }).format(date);
};
