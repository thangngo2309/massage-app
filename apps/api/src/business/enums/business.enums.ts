export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SYSTEM_ADMIN = 'system_admin',
  CLIENT = 'client',
  THERAPIST = 'therapist',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum Gender {
  UNKNOWN = 'unknown',
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum TherapistVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum TherapistOnlineStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy',
}

export enum TherapistServiceAreaType {
  DISTRICT = 'district',
  RADIUS = 'radius',
}

export enum BookingStatus {
  PENDING = 'pending',
  SEARCHING_THERAPIST = 'searching_therapist',
  WAITING_THERAPIST_ACCEPT = 'waiting_therapist_accept',
  CONFIRMED = 'confirmed',
  THERAPIST_ON_THE_WAY = 'therapist_on_the_way',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED_BY_CLIENT = 'cancelled_by_client',
  CANCELLED_BY_THERAPIST = 'cancelled_by_therapist',
  CANCELLED_BY_ADMIN = 'cancelled_by_admin',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}
