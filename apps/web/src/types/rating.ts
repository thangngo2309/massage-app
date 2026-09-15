export type Rating = {
  id: number;

  bookingId: number;

  clientId?: number;

  therapistId: number;

  rating: number;

  comment?: string | null;

  createdAt: string;

  updatedAt?: string;

  client?: {
    id?: number;

    fullName?: string | null;

    avatarUrl?: string | null;
  } | null;
};

export type CreateRatingPayload = {
  bookingId: number;

  rating: number;

  comment?: string;
};

export type TherapistRatingsResponse = {
  items: Rating[];

  pagination: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
};
