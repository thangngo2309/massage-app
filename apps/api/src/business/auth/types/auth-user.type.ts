import { UserRole } from '../../enums/business.enums.js';

export interface AuthUser {
  sub: number;
  role: UserRole;
  type: 'access';
  iat?: number;
  exp?: number;
}
