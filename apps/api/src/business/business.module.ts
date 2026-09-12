import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../shared/shared.module.js';

import { BUSINESS_CONTROLLERS } from './business.controllers.js';
import { BUSINESS_PROVIDERS } from './business.providers.js';
import { BUSINESS_ENTITIES } from './entities/business.entities.js';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature(BUSINESS_ENTITIES)],
  controllers: [...BUSINESS_CONTROLLERS],
  providers: [...BUSINESS_PROVIDERS],
  exports: [...BUSINESS_PROVIDERS],
})
export class BusinessModule {}
