import { apiFetch } from "@/lib/http";

export type AdministrativeProvince = {
  id: number;

  code: string;

  name: string;

  nameEn: string | null;

  type: string | null;
};

export type AdministrativeWard = {
  id: number;

  code: string;

  name: string;

  nameEn: string | null;

  type: string | null;

  provinceCode: string;

  provinceName: string;

  provinceNameEn: string | null;
};

export const getAdministrativeProvinces = () =>
  apiFetch<AdministrativeProvince[]>("/locations/provinces");

export const getAdministrativeWards = (provinceCode: string) =>
  apiFetch<AdministrativeWard[]>(
    `/locations/provinces/${encodeURIComponent(provinceCode)}/wards`
  );
