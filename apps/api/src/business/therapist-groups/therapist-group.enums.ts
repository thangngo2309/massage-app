export enum TherapistGroupMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export enum TherapistGroupInvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum BookingTherapistTransferStatus {
  /**
   * A đã gửi yêu cầu cho B.
   * Đang chờ B xác nhận đồng ý với đề nghị chuyển.
   */
  PENDING_THERAPIST = 'pending_therapist',

  /**
   * B đã đồng ý với đề nghị chuyển.
   * Đang chờ khách xác nhận đồng ý đổi từ A sang B.
   */
  PENDING_CLIENT = 'pending_client',

  /**
   * Khách đã đồng ý B.
   * Đang chờ B bấm nhận booking chính thức.
   */
  READY_TO_ACCEPT = 'ready_to_accept',

  /**
   * B đã nhận booking chính thức.
   */
  COMPLETED = 'completed',

  REJECTED_BY_THERAPIST = 'rejected_by_therapist',

  REJECTED_BY_CLIENT = 'rejected_by_client',

  CANCELLED = 'cancelled',

  /**
   * Yêu cầu chuyển chưa hoàn tất trước thời điểm booking bắt đầu.
   *
   * Request này không còn được phép đi tiếp trong transfer flow.
   */
  EXPIRED = 'expired',
}
