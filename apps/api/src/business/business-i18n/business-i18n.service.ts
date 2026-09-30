import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { I18nLanguage } from '../entities/i18n-language.entity.js';

export interface BusinessTranslationLike {
  locale: string;
}

@Injectable()
export class BusinessI18nService {
  constructor(
    @InjectRepository(I18nLanguage)
    private readonly languageRepository: Repository<I18nLanguage>,
  ) {}

  async resolveLocale(acceptLanguage?: string | null): Promise<string> {
    const requestedLocales = this.parseAcceptLanguage(acceptLanguage);

    if (requestedLocales.length > 0) {
      const languages = await this.languageRepository.find({
        where: {
          isActive: true,
        },
        order: {
          isDefault: 'DESC',
          id: 'ASC',
        },
      });

      for (const requested of requestedLocales) {
        const exact = languages.find(
          (language) => language.code.toLowerCase() === requested.toLowerCase(),
        );

        if (exact) {
          return exact.code;
        }

        const base = requested.split('-')[0]?.toLowerCase();

        if (base) {
          const baseMatch = languages.find(
            (language) => language.code.split('-')[0]?.toLowerCase() === base,
          );

          if (baseMatch) {
            return baseMatch.code;
          }
        }
      }

      const defaultLanguage = languages.find((language) => language.isDefault);

      if (defaultLanguage) {
        return defaultLanguage.code;
      }

      const vietnamese = languages.find(
        (language) => language.code.toLowerCase() === 'vi',
      );

      if (vietnamese) {
        return vietnamese.code;
      }

      if (languages.length > 0) {
        return languages[0].code;
      }
    }

    return this.getDefaultLocale();
  }

  async getDefaultLocale(): Promise<string> {
    const defaultLanguage = await this.languageRepository.findOne({
      where: {
        isActive: true,
        isDefault: true,
      },
      order: {
        id: 'ASC',
      },
    });

    if (defaultLanguage) {
      return defaultLanguage.code;
    }

    const vietnamese = await this.languageRepository.findOne({
      where: {
        code: 'vi',
        isActive: true,
      },
    });

    if (vietnamese) {
      return vietnamese.code;
    }

    const firstLanguage = await this.languageRepository.findOne({
      where: {
        isActive: true,
      },
      order: {
        id: 'ASC',
      },
    });

    return firstLanguage?.code ?? 'vi';
  }

  async validateLocales(locales: string[]): Promise<void> {
    if (locales.length === 0) {
      return;
    }

    const normalized = [
      ...new Set(locales.map((locale) => this.normalizeLocale(locale))),
    ];

    const languages = await this.languageRepository
      .createQueryBuilder('language')
      .where('LOWER(language.code) IN (:...codes)', {
        codes: normalized.map((item) => item.toLowerCase()),
      })
      .andWhere('language.isActive = :isActive', {
        isActive: true,
      })
      .getMany();

    const existing = new Set(
      languages.map((language) => language.code.toLowerCase()),
    );

    const invalid = normalized.filter(
      (locale) => !existing.has(locale.toLowerCase()),
    );

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Unsupported translation locale: ${invalid.join(', ')}`,
      );
    }
  }

  resolveTranslation<T extends BusinessTranslationLike>(
    translations: T[] | undefined | null,
    locale: string,
  ): T | null {
    if (!translations?.length) {
      return null;
    }

    const normalizedLocale = locale.toLowerCase();

    const exact = translations.find(
      (translation) => translation.locale.toLowerCase() === normalizedLocale,
    );

    if (exact) {
      return exact;
    }

    const base = normalizedLocale.split('-')[0];

    const baseMatch = translations.find(
      (translation) => translation.locale.toLowerCase().split('-')[0] === base,
    );

    if (baseMatch) {
      return baseMatch;
    }

    const vietnamese = translations.find(
      (translation) => translation.locale.toLowerCase() === 'vi',
    );

    if (vietnamese) {
      return vietnamese;
    }

    return translations[0] ?? null;
  }

  normalizeLocale(locale: string): string {
    const parts = locale.trim().split('-');

    return parts
      .map((part, index) =>
        index === 0 ? part.toLowerCase() : part.toUpperCase(),
      )
      .join('-');
  }

  private parseAcceptLanguage(acceptLanguage?: string | null): string[] {
    if (!acceptLanguage?.trim()) {
      return [];
    }

    return acceptLanguage
      .split(',')
      .map((part) => {
        const [locale, ...parameters] = part.trim().split(';');

        let quality = 1;

        for (const parameter of parameters) {
          const match = parameter.trim().match(/^q=([0-9.]+)$/i);

          if (match) {
            quality = Number(match[1]);
          }
        }

        return {
          locale: locale.trim(),
          quality,
        };
      })
      .filter(
        (item) =>
          item.locale &&
          item.locale !== '*' &&
          Number.isFinite(item.quality) &&
          item.quality > 0,
      )
      .sort((a, b) => b.quality - a.quality)
      .map((item) => this.normalizeLocale(item.locale));
  }
}
