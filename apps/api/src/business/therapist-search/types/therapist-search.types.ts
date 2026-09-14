export interface TherapistSearchItem {
  therapistId: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  serviceOptionId: number;
  serviceName: string;
  optionLabel: string | null;
  durationMinutes: number;
  price: number;
  platformFeeRate: number;
  experienceYears: number;
  ratingAverage: number;
  ratingCount: number;
  completedBookings: number;
  onlineStatus: string;
  distanceKm: number | null;
  available: boolean;
}

export interface TherapistSearchResponse {
  items: TherapistSearchItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
