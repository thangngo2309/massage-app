import { apiFetch } from "@/lib/http";

import type {
  CreateTherapistScheduleExceptionPayload,
  ReplaceWorkingHoursPayload,
  TherapistImage,
  TherapistScheduleException,
  TherapistSelfProfile,
  TherapistSelfService,
  TherapistWorkingHour,
  UpdateAcceptingBookingsPayload,
  UpdateTherapistImageOrderPayload,
  UpdateTherapistProfilePayload,
  UpdateTherapistServicePayload,
} from "@/types/therapist-self";

const ENDPOINTS = {
  profile: "/therapist/me",

  accepting: "/therapist/me/accepting-bookings",

  services: "/therapist/me/services",

  service: (id: number) => `/therapist/me/services/${id}`,

  workingHours: "/therapist/me/working-hours",

  exceptions: "/therapist/me/schedule-exceptions",

  exception: (id: number) => `/therapist/me/schedule-exceptions/${id}`,

  images: "/therapist/images",

  image: (id: number) => `/therapist/images/${id}`,

  imageOrder: "/therapist/images/order",
};

export const getTherapistSelfProfile = () => {
  return apiFetch<TherapistSelfProfile>(ENDPOINTS.profile);
};

export const updateTherapistSelfProfile = (
  payload: UpdateTherapistProfilePayload
) => {
  return apiFetch<TherapistSelfProfile>(ENDPOINTS.profile, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
};

export const updateAcceptingBookings = (
  payload: UpdateAcceptingBookingsPayload
) => {
  return apiFetch<TherapistSelfProfile>(ENDPOINTS.accepting, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
};

export const getTherapistSelfServices = () => {
  return apiFetch<TherapistSelfService[]>(ENDPOINTS.services);
};

export const updateTherapistSelfService = (
  id: number,
  payload: UpdateTherapistServicePayload
) => {
  return apiFetch<TherapistSelfService>(ENDPOINTS.service(id), {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
};

export const getTherapistWorkingHours = () => {
  return apiFetch<TherapistWorkingHour[]>(ENDPOINTS.workingHours);
};

export const replaceTherapistWorkingHours = (
  payload: ReplaceWorkingHoursPayload
) => {
  const items = payload.items.map((item) => ({
    dayOfWeek: item.dayOfWeek,
    startTime: item.startTime,
    endTime: item.endTime,
    isActive: item.isActive,
  }));

  return apiFetch<TherapistWorkingHour[]>(ENDPOINTS.workingHours, {
    method: "PUT",

    body: JSON.stringify({
      items,
    }),
  });
};

export const getTherapistScheduleExceptions = () => {
  return apiFetch<TherapistScheduleException[]>(ENDPOINTS.exceptions);
};

export const createTherapistScheduleException = (
  payload: CreateTherapistScheduleExceptionPayload
) => {
  return apiFetch<TherapistScheduleException>(ENDPOINTS.exceptions, {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const deleteTherapistScheduleException = (id: number) => {
  return apiFetch<void>(ENDPOINTS.exception(id), {
    method: "DELETE",
  });
};

/**
 * =========================================
 * THERAPIST IMAGES
 * =========================================
 */
export const getTherapistSelfImages =
  () => {
    return apiFetch<
      TherapistImage[]
    >(ENDPOINTS.images);
  };

export const uploadTherapistSelfImages =
  (files: File[]) => {
    const formData =
      new FormData();

    for (const file of files) {
      formData.append(
        "images",
        file
      );
    }

    return apiFetch<
      TherapistImage[]
    >(ENDPOINTS.images, {
      method: "POST",

      body: formData,
    });
  };

export const deleteTherapistSelfImage =
  (id: number) => {
    return apiFetch<{
      success: boolean;
    }>(
      ENDPOINTS.image(id),
      {
        method: "DELETE",
      }
    );
  };

export const updateTherapistSelfImageOrder =
  (
    payload: UpdateTherapistImageOrderPayload
  ) => {
    return apiFetch<
      TherapistImage[]
    >(
      ENDPOINTS.imageOrder,
      {
        method: "PATCH",

        body: JSON.stringify(
          payload
        ),
      }
    );
  };