import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { RedisService } from './redis/redis.service.js';

export const SHARED_PROVIDERS = [JwtAuthGuard, RolesGuard, RedisService];
