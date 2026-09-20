export type I18nLanguage = {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  version?: string;
};

export type I18nResourcePack = Record<string, Record<string, unknown>>;

export type I18nVersionResponse = {
  language: string;
  version: string;
  updatedAt?: string;
};

export type I18nResourcesResponse = {
  language: string;
  version: string;
  resources: I18nResourcePack;
};
