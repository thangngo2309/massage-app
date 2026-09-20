export type I18nLanguage = {
  id?: number;
  code: string;
  name: string;
  nativeName?: string | null;
  isDefault: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type I18nNamespaceResource = Record<string, unknown>;

export type I18nResourcePack = Record<string, I18nNamespaceResource>;

export type I18nVersionResponse = {
  language?: string;
  version: string;
};

export type I18nResourcesResponse = {
  language?: string;
  version: string;
  resources: I18nResourcePack;
};
