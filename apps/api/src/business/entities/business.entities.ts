import { BookingStatusHistory } from "./booking-status-history.entity.js";
import { Booking } from "./booking.entity.js";
import { ClientProfile } from "./client-profile.entity.js";
import { I18nLanguage } from "./i18n-language.entity.js";
import { I18nResource } from "./i18n-resource.entity.js";
import { Rating } from "./rating.entity.js";
import { RefreshToken } from "./refresh-token.entity.js";
import { ServiceOption } from "./service-option.entity.js";
import { MassageService } from "./service.entity.js";
import { TherapistProfile } from "./therapist-profile.entity.js";
import { TherapistScheduleException } from "./therapist-schedule-exception.entity.js";
import { TherapistServiceArea } from "./therapist-service-area.entity.js";
import { TherapistService } from "./therapist-service.entity.js";
import { TherapistWorkingHour } from "./therapist-working-hour.entity.js";
import { User } from "./user.entity.js";

export const BUSINESS_ENTITIES = [
  User,
  RefreshToken,
  ClientProfile,
  TherapistProfile,
  MassageService,
  ServiceOption,
  TherapistService,
  TherapistWorkingHour,
  TherapistScheduleException,
  TherapistServiceArea,
  Booking,
  BookingStatusHistory,
  Rating,
  I18nLanguage,
  I18nResource,
];
