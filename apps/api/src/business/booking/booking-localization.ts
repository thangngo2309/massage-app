import { In } from 'typeorm';
import type { DataSource } from 'typeorm';

import { ServiceOption } from '../entities/service-option.entity.js';

import type { BusinessI18nService } from '../business-i18n/business-i18n.service.js';

/**
 * ================================================================
 * BOOKING LOCALIZATION SOURCE
 * ================================================================
 *
 * Chỉ yêu cầu đúng 2 field mà helper localization thực sự cần.
 *
 * Không dùng:
 *
 * [key: string]: unknown
 *
 * vì Booking là class entity và không có index signature đó.
 */
export type BookingLocalizationSource = {
  serviceOptionId: number;

  /**
   * Giá trị này là snapshot tên dịch vụ trong Booking entity.
   */
  serviceName: string;
};

/**
 * ================================================================
 * LOCALIZED BOOKING
 * ================================================================
 *
 * Giữ nguyên toàn bộ field của booking gốc.
 *
 * Đồng thời bổ sung:
 *
 * - serviceNameSnapshot
 * - serviceOptionLabel
 *
 * và override serviceName thành tên đã localize.
 */
export type LocalizedBooking<T extends BookingLocalizationSource> = T & {
  /**
   * Snapshot tên dịch vụ tại thời điểm booking được tạo.
   */
  serviceNameSnapshot: string;

  /**
   * Tên dịch vụ dùng để hiển thị theo locale hiện tại.
   */
  serviceName: string;

  /**
   * Label của ServiceOption đã được localize.
   */
  serviceOptionLabel: string | null;
};

/**
 * ================================================================
 * LOCALIZE BOOKING ITEMS
 * ================================================================
 *
 * Không thay đổi dữ liệu Booking trong DB.
 *
 * Response:
 *
 * serviceNameSnapshot
 *   = booking.serviceName snapshot
 *
 * serviceName
 *   = ServiceTranslation.name theo locale
 *   fallback booking.serviceName
 *
 * serviceOptionLabel
 *   = ServiceOptionTranslation.label theo locale
 *   fallback ServiceOption.label
 *
 * Chỉ query ServiceOption một lần cho toàn bộ danh sách booking,
 * tránh N+1 query.
 */
export async function localizeBookingItems<T extends BookingLocalizationSource>(
  dataSource: DataSource,
  businessI18nService: BusinessI18nService,
  items: T[],
  acceptLanguage?: string | null,
): Promise<Array<LocalizedBooking<T>>> {
  if (!items.length) {
    return [];
  }

  /**
   * Resolve locale một lần cho toàn bộ response.
   */
  const locale = await businessI18nService.resolveLocale(acceptLanguage);

  /**
   * Gom toàn bộ ServiceOption id duy nhất.
   */
  const serviceOptionIds = [
    ...new Set(
      items
        .map((item) => item.serviceOptionId)
        .filter(
          (serviceOptionId) =>
            Number.isInteger(serviceOptionId) && serviceOptionId > 0,
        ),
    ),
  ];

  /**
   * Trường hợp dữ liệu bất thường không có serviceOptionId hợp lệ:
   * vẫn trả booking với snapshot để UI không bị lỗi.
   */
  if (!serviceOptionIds.length) {
    return items.map((item) => ({
      ...item,

      serviceNameSnapshot: item.serviceName,

      serviceName: item.serviceName,

      serviceOptionLabel: null,
    }));
  }

  /**
   * Load ServiceOption + Service + translations.
   *
   * Một query cho toàn bộ booking list.
   */
  const serviceOptions = await dataSource.getRepository(ServiceOption).find({
    where: {
      id: In(serviceOptionIds),
    },

    relations: {
      translations: true,

      service: {
        translations: true,
      },
    },
  });

  const serviceOptionMap = new Map(
    serviceOptions.map((option) => [option.id, option]),
  );

  return items.map((item) => {
    /**
     * serviceName ở entity Booking chính là snapshot.
     *
     * Lưu lại trước khi override response.
     */
    const serviceNameSnapshot = item.serviceName;

    const serviceOption = serviceOptionMap.get(item.serviceOptionId);

    /**
     * Nếu ServiceOption không còn tồn tại hoặc vì lý do nào đó
     * không load được thì fallback hoàn toàn về snapshot.
     */
    if (!serviceOption) {
      return {
        ...item,

        serviceNameSnapshot,

        serviceName: serviceNameSnapshot,

        serviceOptionLabel: null,
      };
    }

    /**
     * Resolve ServiceTranslation.
     */
    const serviceTranslation = businessI18nService.resolveTranslation(
      serviceOption.service.translations,
      locale,
    );

    /**
     * Resolve ServiceOptionTranslation.
     */
    const optionTranslation = businessI18nService.resolveTranslation(
      serviceOption.translations,
      locale,
    );

    return {
      ...item,

      /**
       * Snapshot lịch sử luôn được trả riêng.
       */
      serviceNameSnapshot,

      /**
       * Ưu tiên translation theo locale hiện tại.
       *
       * Nếu không có translation:
       *
       * fallback về snapshot của booking,
       *
       * KHÔNG fallback về service.name hiện tại,
       * vì tên service hiện tại có thể đã thay đổi sau khi booking được tạo.
       */
      serviceName: serviceTranslation?.name ?? serviceNameSnapshot,

      /**
       * ServiceOption không có snapshot riêng trong booking hiện tại,
       * nên fallback về label gốc của ServiceOption.
       */
      serviceOptionLabel:
        optionTranslation?.label ?? serviceOption.label ?? null,
    };
  });
}

/**
 * ================================================================
 * LOCALIZE ONE BOOKING
 * ================================================================
 */
export async function localizeBookingItem<T extends BookingLocalizationSource>(
  dataSource: DataSource,
  businessI18nService: BusinessI18nService,
  item: T,
  acceptLanguage?: string | null,
): Promise<LocalizedBooking<T>> {
  const localizedItems = await localizeBookingItems(
    dataSource,
    businessI18nService,
    [item],
    acceptLanguage,
  );

  return localizedItems[0];
}

/**
 * ================================================================
 * LOCALIZE PAGINATED BOOKING RESPONSE
 * ================================================================
 *
 * Input:
 *
 * {
 *   items: Booking[],
 *   pagination: ...
 * }
 *
 * Output giữ nguyên pagination và localize items.
 */
export async function localizeBookingListResponse<
  T extends BookingLocalizationSource,
  R extends {
    items: T[];
  },
>(
  dataSource: DataSource,
  businessI18nService: BusinessI18nService,
  response: R,
  acceptLanguage?: string | null,
): Promise<
  Omit<R, 'items'> & {
    items: Array<LocalizedBooking<T>>;
  }
> {
  const items = await localizeBookingItems(
    dataSource,
    businessI18nService,
    response.items,
    acceptLanguage,
  );

  return {
    ...response,

    items,
  };
}
