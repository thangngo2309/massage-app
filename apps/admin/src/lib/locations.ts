import { apiRequest } from "@/lib/api";

export type AdministrativeProvinceItem = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string | null;
};

export type AdministrativeWardItem = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string | null;
  provinceCode: string;
  provinceName: string;
  provinceNameEn: string | null;
};

export function getAdministrativeProvinces() {
  return apiRequest<AdministrativeProvinceItem[]>("/locations/provinces");
}

export function getAdministrativeWards(provinceCode: string) {
  return apiRequest<AdministrativeWardItem[]>(
    `/locations/provinces/${encodeURIComponent(provinceCode)}/wards`
  );
}
