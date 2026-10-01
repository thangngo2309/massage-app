import type {
  PromotionAudience,
  PromotionRewardRecipient,
  PromotionRewardType,
  PromotionTriggerType,
} from "@/lib/promotions";

export interface PromotionAudienceDefinition {
  value: PromotionAudience;

  label: string;
}

export interface PromotionRewardTypeDefinition {
  value: PromotionRewardType;

  label: string;
}

export interface PromotionRewardRecipientDefinition {
  value: PromotionRewardRecipient;

  label: string;
}

export interface PromotionTriggerDefinition {
  value: PromotionTriggerType;

  label: string;

  description: string;

  allowedAudiences: readonly PromotionAudience[];

  allowedRecipients: readonly PromotionRewardRecipient[];

  defaultRecipient: PromotionRewardRecipient;
}

export const PROMOTION_AUDIENCE_DEFINITIONS = [
  {
    value: "client",
    label: "Khách hàng",
  },

  {
    value: "therapist",
    label: "Kỹ thuật viên",
  },
] as const satisfies readonly PromotionAudienceDefinition[];

export const PROMOTION_REWARD_TYPE_DEFINITIONS = [
  {
    value: "wallet_credit",
    label: "Cộng ví khuyến mãi",
  },

  {
    value: "voucher",
    label: "Cấp voucher",
  },
] as const satisfies readonly PromotionRewardTypeDefinition[];

export const PROMOTION_REWARD_RECIPIENT_DEFINITIONS = [
  {
    value: "actor",
    label: "Người thực hiện hành động",
  },

  {
    value: "referrer",
    label: "Người giới thiệu",
  },
] as const satisfies readonly PromotionRewardRecipientDefinition[];

export const PROMOTION_TRIGGER_DEFINITIONS = [
  {
    value: "registration_completed",

    label: "Đăng ký thành công",

    description:
      "Kích hoạt sau khi người dùng xác thực OTP và tài khoản được kích hoạt thành công.",

    allowedAudiences: ["client", "therapist"],

    allowedRecipients: ["actor"],

    defaultRecipient: "actor",
  },

  {
    value: "referral_code_entered",

    label: "Nhập mã giới thiệu",

    description:
      "Kích hoạt sau khi người dùng nhập mã giới thiệu hợp lệ và hoàn tất xác thực OTP. Người nhận thưởng là người giới thiệu.",

    allowedAudiences: ["client", "therapist"],

    allowedRecipients: ["referrer"],

    defaultRecipient: "referrer",
  },

  {
    value: "first_booking_completed",

    label: "Hoàn thành booking đầu tiên",

    description: "Kích hoạt khi người dùng hoàn thành booking đầu tiên.",

    allowedAudiences: ["client", "therapist"],

    allowedRecipients: ["actor"],

    defaultRecipient: "actor",
  },
] as const satisfies readonly PromotionTriggerDefinition[];

export function getPromotionAudienceDefinition(
  value: PromotionAudience
): PromotionAudienceDefinition {
  return (
    PROMOTION_AUDIENCE_DEFINITIONS.find((item) => item.value === value) ?? {
      value,
      label: value,
    }
  );
}

export function getPromotionRewardTypeDefinition(
  value: PromotionRewardType
): PromotionRewardTypeDefinition {
  return (
    PROMOTION_REWARD_TYPE_DEFINITIONS.find((item) => item.value === value) ?? {
      value,
      label: value,
    }
  );
}

export function getPromotionRewardRecipientDefinition(
  value: PromotionRewardRecipient
): PromotionRewardRecipientDefinition {
  return (
    PROMOTION_REWARD_RECIPIENT_DEFINITIONS.find(
      (item) => item.value === value
    ) ?? {
      value,
      label: value,
    }
  );
}

export function getPromotionTriggerDefinition(
  value: PromotionTriggerType
): PromotionTriggerDefinition {
  const definition = PROMOTION_TRIGGER_DEFINITIONS.find(
    (item) => item.value === value
  );

  if (!definition) {
    return {
      value,

      label: value,

      description: value,

      allowedAudiences: ["client", "therapist"],

      allowedRecipients: ["actor"],

      defaultRecipient: "actor",
    };
  }

  return definition;
}

export function getPromotionRecipientLabel(
  triggerType: PromotionTriggerType,

  recipient: PromotionRewardRecipient
) {
  if (triggerType === "registration_completed" && recipient === "actor") {
    return "Người đăng ký";
  }

  if (triggerType === "referral_code_entered" && recipient === "referrer") {
    return "Người giới thiệu";
  }

  if (triggerType === "first_booking_completed" && recipient === "actor") {
    return "Người hoàn thành booking đầu tiên";
  }

  return getPromotionRewardRecipientDefinition(recipient).label;
}
