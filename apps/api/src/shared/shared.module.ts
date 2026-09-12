import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SHARED_PROVIDERS } from './shared.providers.js';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: SHARED_PROVIDERS,
  exports: [JwtModule, ...SHARED_PROVIDERS],
})
export class SharedModule {}
