export enum UserRole {
  SUPER_ADMIN = "super_admin",
  SYSTEM_ADMIN = "system_admin",
  CLIENT = "client",
  THERAPIST = "therapist",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export type AuthUser = {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;

  role: UserRole;
  status: UserStatus;

  lastLoginAt?: string | null;
  createdAt?: string;
};

export type LoginPayload = {
  login: string;
  password: string;
  deviceName?: string;
};

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email?: string;

  password: string;

  role:
    | UserRole.CLIENT
    | UserRole.THERAPIST;

  deviceName?: string;
};

/**
 * Login response.
 *
 * Login vẫn giữ nguyên cơ chế cũ:
 * accessToken + refreshToken.
 */
export type AuthResponse = {
  user: AuthUser;

  accessToken: string;
  refreshToken: string;

  tokenType?: string;
  expiresIn?: number;

  accessTokenExpiresIn?: number;
  refreshTokenExpiresAt?: string;
};

/**
 * Register response.
 *
 * Register không còn trả token vì account
 * phải xác thực OTP trước.
 */
export type RegisterResponse = {
  user: AuthUser;

  requiresOtp: boolean;
  message: string;
};

export type SendOtpPayload = {
  phone: string;
};

export type SendOtpResponse = {
  success: boolean;
  message: string;

  expiresIn?: number;
  resendAfter?: number;
};

export type VerifyOtpPayload = {
  phone: string;
  code: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;

  user?: AuthUser;

  tokenType?: string;
  expiresIn?: number;

  accessTokenExpiresIn?: number;
  refreshTokenExpiresAt?: string;
};

export type LogoutResponse = {
  success: boolean;
};