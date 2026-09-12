import { createHash, randomBytes } from 'node:crypto';

export const normalizeEmail = (email?: string | null): string | null => {
  if (!email) {
    return null;
  }

  const value = email.trim().toLowerCase();

  return value || null;
};

export const normalizeVietnamPhone = (phone: string): string => {
  let value = phone.trim().replace(/[\s.-]/g, '');

  if (value.startsWith('0084')) {
    value = `+84${value.slice(4)}`;
  }

  if (value.startsWith('84') && !value.startsWith('+84')) {
    value = `+${value}`;
  }

  if (value.startsWith('0')) {
    value = `+84${value.slice(1)}`;
  }

  return value;
};

export const tryNormalizeVietnamPhone = (value: string): string | null => {
  const normalized = normalizeVietnamPhone(value);

  if (!/^\+84[35789]\d{8}$/.test(normalized)) {
    return null;
  }

  return normalized;
};

export const generateRefreshToken = (): string => {
  return randomBytes(48).toString('base64url');
};

export const hashRefreshToken = (refreshToken: string): string => {
  return createHash('sha256').update(refreshToken).digest('hex');
};

export const buildRefreshTokenExpiresAt = (days: number): Date => {
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + days);

  return expiresAt;
};
