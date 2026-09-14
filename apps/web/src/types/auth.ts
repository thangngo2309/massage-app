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

  role: UserRole.CLIENT | UserRole.THERAPIST;

  deviceName?: string;
};

export type AuthResponse = {
  user: AuthUser;

  accessToken: string;
  refreshToken: string;

  tokenType?: string;
  expiresIn?: number;

  accessTokenExpiresIn?: number;
  refreshTokenExpiresAt?: string;
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
