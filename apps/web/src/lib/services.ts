import { apiFetch } from "@/lib/http";

import type { Service, ServiceListItem } from "@/types/service";

const SERVICES_PATH = "/services";

export const getClientServices = () => {
  return apiFetch<ServiceListItem[]>(SERVICES_PATH);
};

export const getClientService = (id: number) => {
  return apiFetch<Service>(`${SERVICES_PATH}/${id}`);
};
