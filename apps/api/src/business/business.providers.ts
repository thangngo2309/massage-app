import { AuthService } from './auth/auth.service.js';
import { BookingRealtimeGateway } from './booking/booking-realtime.gateway.js';
import { BookingService } from './booking/booking.service.js';
import { RatingService } from './rating/rating.service.js';
import { ServicesService } from './services/services.service.js';
import { TherapistAvailabilityService } from './therapist-availability/therapist-availability.service.js';
import { TherapistSearchService } from './therapist-search/therapist-search.service.js';
import { TherapistSelfService } from './therapists/therapist-self.service.js';
import { TherapistsService } from './therapists/therapists.service.js';
import { UsersService } from './users/users.service.js';

export const BUSINESS_PROVIDERS = [
  AuthService,
  UsersService,
  ServicesService,
  TherapistsService,
  TherapistAvailabilityService,
  TherapistSearchService,
  BookingService,
  RatingService,
  TherapistSelfService,
  BookingRealtimeGateway
];
