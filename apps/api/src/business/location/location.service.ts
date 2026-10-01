import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AdministrativeProvince } from '../entities/administrative-province.entity.js';
import { AdministrativeWard } from '../entities/administrative-ward.entity.js';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(AdministrativeProvince)
    private readonly provinceRepository: Repository<AdministrativeProvince>,

    @InjectRepository(AdministrativeWard)
    private readonly wardRepository: Repository<AdministrativeWard>,
  ) {}

  /**
   * ==========================================================
   * PROVINCES
   * ==========================================================
   */

  async getProvinces() {
    const provinces = await this.provinceRepository.find({
      where: {
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
        id: 'ASC',
      },
    });

    return provinces.map((province) => this.mapProvince(province));
  }

  /**
   * ==========================================================
   * WARDS BY PROVINCE
   * ==========================================================
   */

  async getWardsByProvinceCode(provinceCode: string) {
    const normalizedProvinceCode = this.normalizeCode(provinceCode);

    const province = await this.provinceRepository.findOne({
      where: {
        code: normalizedProvinceCode,
        isActive: true,
      },
    });

    if (!province) {
      throw new NotFoundException('Tỉnh/thành phố không tồn tại');
    }

    const wards = await this.wardRepository.find({
      where: {
        provinceId: province.id,
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
        id: 'ASC',
      },
    });

    return wards.map((ward) => ({
      id: ward.id,

      code: ward.code,

      name: ward.name,

      nameEn: ward.nameEn,

      type: ward.type,

      provinceCode: province.code,

      provinceName: province.name,

      provinceNameEn: province.nameEn,
    }));
  }

  /**
   * ==========================================================
   * LOOKUP PROVINCE
   * ==========================================================
   *
   * Helper này sẽ được sử dụng ở bước tiếp theo để validate
   * provinceCode khi tạo khu vực phục vụ của KTV.
   */

  async findProvinceByCode(
    provinceCode: string,
  ): Promise<AdministrativeProvince | null> {
    const code = this.normalizeCode(provinceCode);

    return this.provinceRepository.findOne({
      where: {
        code,
        isActive: true,
      },
    });
  }

  /**
   * ==========================================================
   * LOOKUP WARD
   * ==========================================================
   */

  async findWardByCode(wardCode: string): Promise<AdministrativeWard | null> {
    const code = this.normalizeCode(wardCode);

    return this.wardRepository.findOne({
      where: {
        code,
        isActive: true,
      },
      relations: {
        province: true,
      },
    });
  }

  /**
   * ==========================================================
   * LOOKUP WARD IN PROVINCE
   * ==========================================================
   *
   * Đây sẽ là helper chính khi TherapistServiceArea chuyển
   * từ districtCode sang wardCode.
   */

  async findWardInProvince(
    provinceCode: string,
    wardCode: string,
  ): Promise<AdministrativeWard | null> {
    const normalizedProvinceCode = this.normalizeCode(provinceCode);

    const normalizedWardCode = this.normalizeCode(wardCode);

    const ward = await this.wardRepository
      .createQueryBuilder('ward')

      .innerJoinAndSelect('ward.province', 'province')

      .where('ward.code = :wardCode', {
        wardCode: normalizedWardCode,
      })

      .andWhere('ward.isActive = true')

      .andWhere('province.code = :provinceCode', {
        provinceCode: normalizedProvinceCode,
      })

      .andWhere('province.isActive = true')

      .getOne();

    return ward;
  }

  /**
   * ==========================================================
   * REQUIRE WARD IN PROVINCE
   * ==========================================================
   *
   * Phiên bản throw exception để business service gọi trực tiếp.
   */

  async requireWardInProvince(
    provinceCode: string,
    wardCode: string,
  ): Promise<AdministrativeWard> {
    const normalizedProvinceCode = this.normalizeCode(provinceCode);

    const normalizedWardCode = this.normalizeCode(wardCode);

    if (!normalizedProvinceCode) {
      throw new BadRequestException('provinceCode is required');
    }

    if (!normalizedWardCode) {
      throw new BadRequestException('wardCode is required');
    }

    const ward = await this.findWardInProvince(
      normalizedProvinceCode,
      normalizedWardCode,
    );

    if (!ward) {
      throw new BadRequestException(
        'Phường/xã không tồn tại hoặc không thuộc tỉnh/thành phố đã chọn',
      );
    }

    return ward;
  }

  /**
   * ==========================================================
   * MAPPING
   * ==========================================================
   */

  private mapProvince(province: AdministrativeProvince) {
    return {
      id: province.id,

      code: province.code,

      name: province.name,

      nameEn: province.nameEn,

      type: province.type,
    };
  }

  /**
   * ==========================================================
   * NORMALIZE CODE
   * ==========================================================
   */

  private normalizeCode(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }
}
