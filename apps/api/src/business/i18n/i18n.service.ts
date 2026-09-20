import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DataSource, Repository } from 'typeorm';

import { I18nLanguage } from '../entities/i18n-language.entity.js';
import { I18nResource } from '../entities/i18n-resource.entity.js';
import { AdminI18nResourceQueryDto } from './dto/admin-i18n-resource-query.dto.js';
import { CreateI18nLanguageDto } from './dto/create-i18n-language.dto.js';
import { UpsertI18nResourceDto } from './dto/upsert-i18n-resource.dto.js';

type ResourceObject = Record<string, unknown>;

@Injectable()
export class I18nService {
  private readonly resourcesDirectory = fileURLToPath(
    new URL('./resources/', import.meta.url),
  );

  private readonly baseCache = new Map<string, ResourceObject>();

  constructor(
    @InjectRepository(I18nLanguage)
    private readonly languageRepository: Repository<I18nLanguage>,

    @InjectRepository(I18nResource)
    private readonly resourceRepository: Repository<I18nResource>,

    private readonly dataSource: DataSource,
  ) {}

  async getLanguages() {
    const languages = await this.languageRepository.find({
      where: {
        isActive: true,
      },
      order: {
        isDefault: 'DESC',
        id: 'ASC',
      },
    });

    return Promise.all(
      languages.map(async (language) => ({
        code: language.code,
        name: language.name,
        nativeName: language.nativeName,
        isDefault: language.isDefault,
        version: await this.buildVersion(language),
      })),
    );
  }

  async getVersion(languageCode: string) {
    const language = await this.getLanguageOrFail(languageCode);

    return {
      language: language.code,
      version: await this.buildVersion(language),
      updatedAt: language.updatedAt,
    };
  }

  async getResources(languageCode: string, namespace?: string) {
    const language = await this.getLanguageOrFail(languageCode);

    const normalizedNamespace = namespace?.trim();

    if (normalizedNamespace && !this.isSafeSegment(normalizedNamespace)) {
      throw new BadRequestException('Invalid namespace');
    }

    let resources: ResourceObject;

    if (normalizedNamespace) {
      resources = await this.loadBaseNamespace(
        language.code,
        normalizedNamespace,
      );
    } else {
      resources = await this.loadAllBaseResources(language.code);
    }

    resources = this.cloneObject(resources);

    const where: {
      languageId: number;
      namespace?: string;
    } = {
      languageId: language.id,
    };

    if (normalizedNamespace) {
      where.namespace = normalizedNamespace;
    }

    const overrides = await this.resourceRepository.find({
      where,
      order: {
        id: 'ASC',
      },
    });

    for (const override of overrides) {
      if (normalizedNamespace) {
        this.setNestedValue(resources, override.key, override.value);

        continue;
      }

      const namespaceResource = this.ensureObject(
        resources,
        override.namespace,
      );

      this.setNestedValue(namespaceResource, override.key, override.value);
    }

    return {
      language: language.code,
      version: await this.buildVersion(language),

      ...(normalizedNamespace
        ? {
            namespace: normalizedNamespace,
          }
        : {}),

      resources,
    };
  }

  async getAdminResources(query: AdminI18nResourceQueryDto) {
    const language = await this.getLanguageOrFail(query.lang, false);

    const page = query.page ?? 1;

    const limit = query.limit ?? 50;

    const qb = this.resourceRepository
      .createQueryBuilder('resource')
      .where('resource.language_id = :languageId', {
        languageId: language.id,
      });

    if (query.namespace) {
      qb.andWhere('resource.namespace = :namespace', {
        namespace: query.namespace,
      });
    }

    if (query.q?.trim()) {
      qb.andWhere(
        `(
            resource.key ILIKE :q
            OR resource.value ILIKE :q
            OR resource.namespace ILIKE :q
          )`,
        {
          q: `%${query.q.trim()}%`,
        },
      );
    }

    qb.orderBy('resource.namespace', 'ASC')
      .addOrderBy('resource.key', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createLanguage(dto: CreateI18nLanguageDto) {
    const code = this.normalizeLanguageCode(dto.code);

    if (!this.isSafeSegment(code)) {
      throw new BadRequestException('Invalid language code');
    }

    const existing = await this.languageRepository.findOne({
      where: {
        code,
      },
    });

    if (existing) {
      throw new BadRequestException('Language already exists');
    }

    const language = await this.dataSource.transaction(async (manager) => {
      const languageRepo = manager.getRepository(I18nLanguage);

      if (dto.isDefault) {
        await languageRepo.update(
          {
            isDefault: true,
          },
          {
            isDefault: false,
          },
        );
      }

      const entity = languageRepo.create({
        code,
        name: dto.name.trim(),
        nativeName: dto.nativeName.trim(),
        isActive: true,
        isDefault: dto.isDefault ?? false,
        revision: 1,
      });

      return languageRepo.save(entity);
    });

    return {
      ...language,
      version: await this.buildVersion(language),
    };
  }

  async upsertResource(dto: UpsertI18nResourceDto) {
    const languageCode = this.normalizeLanguageCode(dto.languageCode);

    const namespace = dto.namespace.trim();

    const key = dto.key.trim();

    this.validateResourcePath(namespace, key);

    await this.dataSource.transaction(async (manager) => {
      const languageRepo = manager.getRepository(I18nLanguage);

      const resourceRepo = manager.getRepository(I18nResource);

      const language = await languageRepo.findOne({
        where: {
          code: languageCode,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!language) {
        throw new NotFoundException('Language not found');
      }

      let resource = await resourceRepo.findOne({
        where: {
          languageId: language.id,
          namespace,
          key,
        },
      });

      if (resource) {
        resource.value = dto.value;
      } else {
        resource = resourceRepo.create({
          languageId: language.id,
          namespace,
          key,
          value: dto.value,
        });
      }

      await resourceRepo.save(resource);

      language.revision += 1;

      await languageRepo.save(language);
    });

    return this.getResources(languageCode, namespace);
  }

  async deleteResource(resourceId: number) {
    let languageCode = '';

    await this.dataSource.transaction(async (manager) => {
      const resourceRepo = manager.getRepository(I18nResource);

      const languageRepo = manager.getRepository(I18nLanguage);

      const resource = await resourceRepo.findOne({
        where: {
          id: resourceId,
        },
      });

      if (!resource) {
        throw new NotFoundException('Translation override not found');
      }

      const language = await languageRepo.findOne({
        where: {
          id: resource.languageId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!language) {
        throw new NotFoundException('Language not found');
      }

      languageCode = language.code;

      await resourceRepo.remove(resource);

      language.revision += 1;

      await languageRepo.save(language);
    });

    return this.getVersion(languageCode);
  }

  private async getLanguageOrFail(languageCode: string, activeOnly = true) {
    const code = this.normalizeLanguageCode(languageCode);

    const language = await this.languageRepository.findOne({
      where: {
        code,
        ...(activeOnly
          ? {
              isActive: true,
            }
          : {}),
      },
    });

    if (!language) {
      throw new NotFoundException(`Language '${code}' not found`);
    }

    return language;
  }

  private async buildVersion(language: I18nLanguage) {
    const baseResources = await this.loadAllBaseResources(language.code);

    const hash = createHash('sha256')
      .update(JSON.stringify(baseResources))
      .digest('hex')
      .slice(0, 12);

    return `${language.revision}-${hash}`;
  }

  private async loadAllBaseResources(
    languageCode: string,
  ): Promise<ResourceObject> {
    const cacheKey = `all:${languageCode}`;

    const cached = this.baseCache.get(cacheKey);

    if (cached) {
      return this.cloneObject(cached);
    }

    if (!this.isSafeSegment(languageCode)) {
      return {};
    }

    const languageDirectory = new URL(
      `./resources/${languageCode}/`,
      import.meta.url,
    );

    let files: string[];

    try {
      const entries = await readdir(fileURLToPath(languageDirectory), {
        withFileTypes: true,
      });

      files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name)
        .sort();
    } catch (error) {
      if (this.isNodeError(error) && error.code === 'ENOENT') {
        return {};
      }

      throw error;
    }

    const result: ResourceObject = {};

    for (const fileName of files) {
      const namespace = fileName.replace(/\.json$/, '');

      result[namespace] = await this.loadBaseNamespace(languageCode, namespace);
    }

    this.baseCache.set(cacheKey, this.cloneObject(result));

    return result;
  }

  private async loadBaseNamespace(
    languageCode: string,
    namespace: string,
  ): Promise<ResourceObject> {
    const cacheKey = `${languageCode}:${namespace}`;

    const cached = this.baseCache.get(cacheKey);

    if (cached) {
      return this.cloneObject(cached);
    }

    if (!this.isSafeSegment(languageCode) || !this.isSafeSegment(namespace)) {
      return {};
    }

    const filePath = fileURLToPath(
      new URL(`./resources/${languageCode}/${namespace}.json`, import.meta.url),
    );

    try {
      const content = await readFile(filePath, 'utf8');

      const parsed = JSON.parse(content) as ResourceObject;

      this.baseCache.set(cacheKey, this.cloneObject(parsed));

      return parsed;
    } catch (error) {
      if (this.isNodeError(error) && error.code === 'ENOENT') {
        return {};
      }

      throw error;
    }
  }

  private setNestedValue(target: ResourceObject, path: string, value: string) {
    const segments = path.split('.');

    const blockedSegments = new Set(['__proto__', 'prototype', 'constructor']);

    let current = target;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];

      if (blockedSegments.has(segment)) {
        throw new BadRequestException('Invalid resource key');
      }

      const existing = current[segment];

      if (
        !existing ||
        typeof existing !== 'object' ||
        Array.isArray(existing)
      ) {
        current[segment] = {};
      }

      current = current[segment] as ResourceObject;
    }

    const lastSegment = segments[segments.length - 1];

    if (blockedSegments.has(lastSegment)) {
      throw new BadRequestException('Invalid resource key');
    }

    current[lastSegment] = value;
  }

  private ensureObject(target: ResourceObject, key: string) {
    const value = target[key];

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      target[key] = {};
    }

    return target[key] as ResourceObject;
  }

  private validateResourcePath(namespace: string, key: string) {
    if (!this.isSafeSegment(namespace)) {
      throw new BadRequestException('Invalid namespace');
    }

    const segments = key.split('.');

    if (
      segments.length === 0 ||
      segments.some((segment) => !this.isSafeSegment(segment))
    ) {
      throw new BadRequestException('Invalid resource key');
    }

    const blocked = ['__proto__', 'prototype', 'constructor'];

    if (segments.some((segment) => blocked.includes(segment))) {
      throw new BadRequestException('Invalid resource key');
    }
  }

  private normalizeLanguageCode(value: string) {
    const parts = value.trim().split('-');

    return parts
      .map((part, index) =>
        index === 0 ? part.toLowerCase() : part.toUpperCase(),
      )
      .join('-');
  }

  private isSafeSegment(value: string) {
    return /^[a-zA-Z0-9_-]+$/.test(value);
  }

  private cloneObject<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error;
  }
}
