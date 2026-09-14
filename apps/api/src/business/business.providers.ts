import { AuthService } from "./auth/auth.service.js";
import { ServicesService } from "./services/services.service.js";
import { TherapistsService } from "./therapists/therapists.service.js";
import { UsersService } from "./users/users.service.js";

export const BUSINESS_PROVIDERS = [AuthService, UsersService, ServicesService, TherapistsService];