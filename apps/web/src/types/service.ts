export type ServiceOption = {
  id: number;

  serviceId: number;

  label: string;

  durationMinutes: number;

  defaultPrice: number;

  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type Service = {
  id: number;

  name: string;

  slug: string;

  description?: string | null;

  imageUrl?: string | null;

  isActive: boolean;

  sortOrder: number;

  options: ServiceOption[];

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ServiceListItem = Service;
