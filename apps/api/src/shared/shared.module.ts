import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SHARED_PROVIDERS } from './shared.providers.js';
import { HealthController } from './controllers/health.controller.js';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [
    HealthController,
  ],
  providers: SHARED_PROVIDERS,
  exports: [JwtModule, ...SHARED_PROVIDERS],
})
export class SharedModule {}
