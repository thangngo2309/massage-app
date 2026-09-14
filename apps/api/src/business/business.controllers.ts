import { AuthController } from './auth/auth.controller.js';
import { AdminBookingController } from './booking/admin-booking.controller.js';
import { BookingController } from './booking/booking.controller.js';
import { TherapistBookingController } from './booking/therapist-booking.controller.js';
import { AdminRatingController } from './rating/admin-rating.controller.js';
import { RatingController } from './rating/rating.controller.js';
import { ServicesPublicController } from './services/services-public.controller.js';
import { ServicesController } from './services/services.controller.js';
import { TherapistAvailabilityController } from './therapist-availability/therapist-availability.controller.js';
import { TherapistSearchController } from './therapist-search/therapist-search.controller.js';
import { TherapistsController } from './therapists/therapists.controller.js';
import { UsersController } from './users/users.controller.js';

export const BUSINESS_CONTROLLERS = [
  AuthController,
  UsersController,
  ServicesController,
  ServicesPublicController,
  TherapistsController,
  TherapistAvailabilityController,
  TherapistSearchController,
  BookingController,
  TherapistBookingController,
  AdminBookingController,
  RatingController,
  AdminRatingController,
];
