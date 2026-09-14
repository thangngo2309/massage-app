import { AuthController } from "./auth/auth.controller.js";
import { ServicesController } from "./services/services.controller.js";
import { TherapistsController } from "./therapists/therapists.controller.js";
import { UsersController } from "./users/users.controller.js";

export const BUSINESS_CONTROLLERS = [AuthController, UsersController, ServicesController, TherapistsController];