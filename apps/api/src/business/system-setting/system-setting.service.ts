import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { EntityManager, Repository } from 'typeorm';

import {
  SystemSetting,
  SystemSettingValueType,
} from '../entities/system-setting.entity.js';

@Injectable()
export class SystemSettingService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  /**
   * ================================================================
   * GET SETTING
   * ================================================================
   */

  async get(key: string, manager?: EntityManager): Promise<SystemSetting> {
    const repository = manager
      ? manager.getRepository(SystemSetting)
      : this.systemSettingRepository;

    const setting = await repository.findOne({
      where: {
        key,
      },
    });

    if (!setting) {
      throw new NotFoundException(`System setting not found: ${key}`);
    }

    return setting;
  }

  /**
   * ================================================================
   * GET STRING
   * ================================================================
   */

  async getString(key: string, manager?: EntityManager): Promise<string> {
    const setting = await this.get(key, manager);

    return setting.value;
  }

  /**
   * ================================================================
   * GET NUMBER
   * ================================================================
   */

  async getNumber(key: string, manager?: EntityManager): Promise<number> {
    const setting = await this.get(key, manager);

    const value = Number(setting.value);

    if (!Number.isFinite(value)) {
      throw new InternalServerErrorException(
        `System setting ${key} is not a valid number`,
      );
    }

    return value;
  }

  /**
   * ================================================================
   * GET BOOLEAN
   * ================================================================
   */

  async getBoolean(key: string, manager?: EntityManager): Promise<boolean> {
    const setting = await this.get(key, manager);

    const value = setting.value.trim().toLowerCase();

    if (value === 'true' || value === '1') {
      return true;
    }

    if (value === 'false' || value === '0') {
      return false;
    }

    throw new InternalServerErrorException(
      `System setting ${key} is not a valid boolean`,
    );
  }

  /**
   * ================================================================
   * GET JSON
   * ================================================================
   */

  async getJson<T>(key: string, manager?: EntityManager): Promise<T> {
    const setting = await this.get(key, manager);

    try {
      return JSON.parse(setting.value) as T;
    } catch {
      throw new InternalServerErrorException(
        `System setting ${key} is not valid JSON`,
      );
    }
  }

  /**
   * ================================================================
   * UPDATE VALUE
   * ================================================================
   *
   * Chuẩn bị sẵn cho Admin Setting sau này.
   */

  async updateValue(key: string, value: string) {
    const setting = await this.get(key);

    setting.value = value;

    return this.systemSettingRepository.save(setting);
  }

  /**
   * ================================================================
   * GET ALL
   * ================================================================
   *
   * Có thể dùng cho Admin sau này.
   */

  async getAll() {
    return this.systemSettingRepository.find({
      order: {
        key: 'ASC',
      },
    });
  }

  /**
   * ================================================================
   * CREATE
   * ================================================================
   */

  async create(params: {
    key: string;
    value: string;
    valueType?: SystemSettingValueType;
    description?: string | null;
    isPublic?: boolean;
  }) {
    const setting = this.systemSettingRepository.create({
      key: params.key,
      value: params.value,
      valueType: params.valueType ?? SystemSettingValueType.STRING,
      description: params.description ?? null,
      isPublic: params.isPublic ?? false,
    });

    return this.systemSettingRepository.save(setting);
  }
}
