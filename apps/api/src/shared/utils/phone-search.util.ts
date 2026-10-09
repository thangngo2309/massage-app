export type PhoneSearchCondition = {
  sql: string;
  parameters: Record<string, string>;
};

/**
 * Sinh các biến thể số điện thoại dùng riêng cho SEARCH.
 *
 * Không dùng helper này để validate hoặc lưu số điện thoại.
 * Dữ liệu trong DB vẫn giữ chuẩn quốc tế +84...
 *
 * Ví dụ:
 *
 * 0901
 * -> 0901
 * -> +84901
 *
 * 84901
 * -> 84901
 * -> +84901
 * -> 0901
 *
 * +84901
 * -> +84901
 * -> 0901
 * -> 84901
 *
 * 0084901
 * -> 0084901
 * -> +84901
 * -> 0901
 * -> 84901
 */
export const buildVietnamPhoneSearchVariants = (
  input?: string | null,
): string[] => {
  if (!input) {
    return [];
  }

  const compact = input.trim().replace(/[\s.()\-]/g, '');

  if (!compact) {
    return [];
  }

  /**
   * Chỉ coi input là phone search khi:
   *
   * - chỉ gồm chữ số;
   * - hoặc có một dấu + ở đầu.
   *
   * Tên/email/text bình thường sẽ không tạo thêm
   * điều kiện phone search.
   */
  if (!/^\+?\d+$/.test(compact)) {
    return [];
  }

  const digitCount = compact.replace(/\D/g, '').length;

  /**
   * Tránh query quá rộng khi user mới nhập 1 ký tự.
   */
  if (digitCount < 2) {
    return [];
  }

  const variants = new Set<string>();

  variants.add(compact);

  if (compact.startsWith('0084') && compact.length > 4) {
    const subscriber = compact.slice(4);

    variants.add(`+84${subscriber}`);
    variants.add(`0${subscriber}`);
    variants.add(`84${subscriber}`);

    return [...variants];
  }

  if (compact.startsWith('+84') && compact.length > 3) {
    const subscriber = compact.slice(3);

    variants.add(`0${subscriber}`);
    variants.add(`84${subscriber}`);

    return [...variants];
  }

  if (compact.startsWith('84') && compact.length > 2) {
    const subscriber = compact.slice(2);

    variants.add(`+84${subscriber}`);
    variants.add(`0${subscriber}`);

    return [...variants];
  }

  if (compact.startsWith('0') && compact.length > 1) {
    variants.add(`+84${compact.slice(1)}`);
  }

  return [...variants];
};

export const buildVietnamPhoneSearchPatterns = (
  input?: string | null,
): string[] =>
  buildVietnamPhoneSearchVariants(input).map((value) => `%${value}%`);

/**
 * Sinh SQL fragment + params để gắn vào TypeORM QueryBuilder.
 *
 * `column` và `paramPrefix` phải là constant trong source code,
 * không truyền trực tiếp từ request.
 */
export const buildVietnamPhoneSearchCondition = (
  column: string,
  input?: string | null,
  paramPrefix = 'phoneSearch',
): PhoneSearchCondition | null => {
  const patterns = buildVietnamPhoneSearchPatterns(input);

  if (!patterns.length) {
    return null;
  }

  const safePrefix = paramPrefix.replace(/[^a-zA-Z0-9_]/g, '_');

  const parameters: Record<string, string> = {};

  const conditions = patterns.map((pattern, index) => {
    const parameterName = `${safePrefix}${index}`;

    parameters[parameterName] = pattern;

    return `${column} ILIKE :${parameterName}`;
  });

  return {
    sql: `(${conditions.join(' OR ')})`,
    parameters,
  };
};
