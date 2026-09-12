import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

export const SHARED_PROVIDERS = [JwtAuthGuard, RolesGuard];
