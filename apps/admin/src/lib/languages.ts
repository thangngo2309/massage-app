import { apiRequest } from "@/lib/api";

export interface AdminLanguageItem {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  version: string;
}

export function getAdminLanguages() {
  return apiRequest<AdminLanguageItem[]>("/admin/i18n/languages");
}
