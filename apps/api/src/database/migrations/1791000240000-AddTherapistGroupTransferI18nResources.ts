import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistGroupTransferI18nResources1791000240000 implements MigrationInterface {
  name = 'AddTherapistGroupTransferI18nResources1791000240000';

  private readonly translations: Translation[] = [
    /**
     * ============================================================
     * NAVIGATION
     * ============================================================
     */
    {
      namespace: 'navigation',
      key: 'therapist.group',
      vi: 'Nhóm kỹ thuật viên',
      en: 'Therapist group',
    },
    {
      namespace: 'navigation',
      key: 'therapist.groupShort',
      vi: 'Nhóm',
      en: 'Group',
    },

    /**
     * ============================================================
     * THERAPIST GROUP
     * ============================================================
     */
    {
      namespace: 'therapistGroup',
      key: 'title',
      vi: 'Nhóm kỹ thuật viên',
      en: 'Therapist group',
    },
    {
      namespace: 'therapistGroup',
      key: 'description',
      vi: 'Tạo nhóm, kết nối với các kỹ thuật viên khác và hỗ trợ chuyển booking trong nội bộ nhóm khi cần.',
      en: 'Create a group, connect with other therapists, and transfer bookings within the group when needed.',
    },

    /**
     * Load error
     */
    {
      namespace: 'therapistGroup',
      key: 'loadError.title',
      vi: 'Không thể tải thông tin nhóm',
      en: 'Unable to load therapist group',
    },

    /**
     * Actions
     */
    {
      namespace: 'therapistGroup',
      key: 'actions.retry',
      vi: 'Thử lại',
      en: 'Try again',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.createGroup',
      vi: 'Tạo nhóm',
      en: 'Create group',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.invite',
      vi: 'Mời vào nhóm',
      en: 'Invite',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.join',
      vi: 'Tham gia',
      en: 'Join',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.reject',
      vi: 'Từ chối',
      en: 'Reject',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.leave',
      vi: 'Rời nhóm',
      en: 'Leave group',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.disband',
      vi: 'Giải tán nhóm',
      en: 'Disband group',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.removeMember',
      vi: 'Xóa thành viên',
      en: 'Remove member',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.acceptTransfer',
      vi: 'Đồng ý chuyển',
      en: 'Accept transfer',
    },
    {
      namespace: 'therapistGroup',
      key: 'actions.acceptBooking',
      vi: 'Nhận booking',
      en: 'Accept booking',
    },

    /**
     * Messages
     */
    {
      namespace: 'therapistGroup',
      key: 'messages.groupCreated',
      vi: 'Đã tạo nhóm kỹ thuật viên.',
      en: 'Therapist group created.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.invitationAccepted',
      vi: 'Đã tham gia nhóm.',
      en: 'You joined the group.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.invitationRejected',
      vi: 'Đã từ chối lời mời.',
      en: 'Invitation rejected.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.invitationSent',
      vi: 'Đã gửi lời mời tham gia nhóm.',
      en: 'Group invitation sent.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.memberRemoved',
      vi: 'Đã xóa thành viên khỏi nhóm.',
      en: 'Member removed from the group.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.groupLeft',
      vi: 'Đã rời nhóm.',
      en: 'You left the group.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.groupDisbanded',
      vi: 'Đã giải tán nhóm.',
      en: 'The group has been disbanded.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.transferAccepted',
      vi: 'Bạn đã đồng ý với yêu cầu chuyển. Đang chờ khách hàng xác nhận.',
      en: 'You accepted the transfer request. Waiting for the client to confirm.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.transferRejected',
      vi: 'Bạn đã từ chối yêu cầu chuyển.',
      en: 'You rejected the transfer request.',
    },
    {
      namespace: 'therapistGroup',
      key: 'messages.bookingAccepted',
      vi: 'Bạn đã nhận booking được chuyển.',
      en: 'You accepted the transferred booking.',
    },

    /**
     * Errors
     */
    {
      namespace: 'therapistGroup',
      key: 'errors.groupNotFound',
      vi: 'Không tìm thấy nhóm kỹ thuật viên.',
      en: 'Therapist group not found.',
    },

    /**
     * Transfer requests
     */
    {
      namespace: 'therapistGroup',
      key: 'transfers.title',
      vi: 'Yêu cầu chuyển booking',
      en: 'Booking transfer requests',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.empty',
      vi: 'Hiện không có yêu cầu chuyển booking nào cần xử lý.',
      en: 'There are no booking transfer requests requiring your action.',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.bookingNumber',
      vi: 'Booking #{{id}}',
      en: 'Booking #{{id}}',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.fromTherapist',
      vi: '{{name}} đề nghị chuyển booking cho bạn.',
      en: '{{name}} proposed transferring this booking to you.',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.group',
      vi: 'Nhóm: {{name}}',
      en: 'Group: {{name}}',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.reason',
      vi: 'Lý do: {{reason}}',
      en: 'Reason: {{reason}}',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.waitingClient',
      vi: 'Bạn đã đồng ý nhận yêu cầu chuyển. Hệ thống đang chờ khách hàng xác nhận kỹ thuật viên mới.',
      en: 'You accepted the transfer request. The client now needs to confirm you as the replacement therapist.',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.status.pendingTherapist',
      vi: 'Chờ bạn xác nhận',
      en: 'Waiting for you',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.status.pendingClient',
      vi: 'Chờ khách xác nhận',
      en: 'Waiting for client',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.status.readyToAccept',
      vi: 'Khách đã đồng ý',
      en: 'Client approved',
    },

    /**
     * Invitations
     */
    {
      namespace: 'therapistGroup',
      key: 'invitations.title',
      vi: 'Lời mời tham gia nhóm',
      en: 'Group invitations',
    },
    {
      namespace: 'therapistGroup',
      key: 'invitations.invitedBy',
      vi: 'Được mời bởi {{name}}',
      en: 'Invited by {{name}}',
    },

    /**
     * Create group
     */
    {
      namespace: 'therapistGroup',
      key: 'create.title',
      vi: 'Tạo nhóm kỹ thuật viên',
      en: 'Create a therapist group',
    },
    {
      namespace: 'therapistGroup',
      key: 'create.description',
      vi: 'Bạn chưa thuộc nhóm nào. Bạn có thể tự tạo một nhóm và mời các kỹ thuật viên khác tham gia.',
      en: 'You are not currently in a group. You can create one and invite other therapists to join.',
    },
    {
      namespace: 'therapistGroup',
      key: 'create.name',
      vi: 'Tên nhóm',
      en: 'Group name',
    },
    {
      namespace: 'therapistGroup',
      key: 'create.namePlaceholder',
      vi: 'Ví dụ: Nhóm KTV Hải Châu',
      en: 'Example: Hai Chau Therapist Team',
    },
    {
      namespace: 'therapistGroup',
      key: 'create.descriptionLabel',
      vi: 'Mô tả',
      en: 'Description',
    },
    {
      namespace: 'therapistGroup',
      key: 'create.descriptionPlaceholder',
      vi: 'Mô tả ngắn về nhóm...',
      en: 'Short description of the group...',
    },

    /**
     * Group
     */
    {
      namespace: 'therapistGroup',
      key: 'group.memberCount_one',
      vi: '{{count}} thành viên',
      en: '{{count}} member',
    },
    {
      namespace: 'therapistGroup',
      key: 'group.memberCount_other',
      vi: '{{count}} thành viên',
      en: '{{count}} members',
    },
    {
      namespace: 'therapistGroup',
      key: 'group.roles.owner',
      vi: 'Chủ nhóm',
      en: 'Group owner',
    },
    {
      namespace: 'therapistGroup',
      key: 'group.roles.member',
      vi: 'Thành viên',
      en: 'Member',
    },

    /**
     * Members
     */
    {
      namespace: 'therapistGroup',
      key: 'members.title',
      vi: 'Thành viên nhóm',
      en: 'Group members',
    },
    {
      namespace: 'therapistGroup',
      key: 'members.acceptingBookings',
      vi: 'Đang nhận booking',
      en: 'Accepting bookings',
    },
    {
      namespace: 'therapistGroup',
      key: 'members.notAcceptingBookings',
      vi: 'Tạm ngừng nhận booking',
      en: 'Not accepting bookings',
    },

    /**
     * Search
     */
    {
      namespace: 'therapistGroup',
      key: 'search.title',
      vi: 'Mời kỹ thuật viên',
      en: 'Invite therapists',
    },
    {
      namespace: 'therapistGroup',
      key: 'search.description',
      vi: 'Tìm kỹ thuật viên chưa thuộc nhóm khác để gửi lời mời tham gia.',
      en: 'Find therapists who are not currently in another group and invite them to join.',
    },
    {
      namespace: 'therapistGroup',
      key: 'search.placeholder',
      vi: 'Tên, số điện thoại hoặc email...',
      en: 'Name, phone number or email...',
    },
    {
      namespace: 'therapistGroup',
      key: 'search.minimumCharacters',
      vi: 'Nhập ít nhất 2 ký tự để tìm kiếm.',
      en: 'Enter at least 2 characters to search.',
    },
    {
      namespace: 'therapistGroup',
      key: 'search.empty',
      vi: 'Không tìm thấy kỹ thuật viên phù hợp.',
      en: 'No matching therapists found.',
    },
    {
      namespace: 'therapistGroup',
      key: 'search.completedBookings_one',
      vi: '{{count}} đơn hoàn thành',
      en: '{{count}} completed booking',
    },
    {
      namespace: 'therapistGroup',
      key: 'search.completedBookings_other',
      vi: '{{count}} đơn hoàn thành',
      en: '{{count}} completed bookings',
    },
    {
      namespace: 'therapistGroup',
      key: 'search.alreadyMember',
      vi: 'Đã trong nhóm',
      en: 'Already a member',
    },

    /**
     * Confirm dialogs
     */
    {
      namespace: 'therapistGroup',
      key: 'confirm.leave',
      vi: 'Bạn có chắc chắn muốn rời khỏi nhóm này không?',
      en: 'Are you sure you want to leave this group?',
    },
    {
      namespace: 'therapistGroup',
      key: 'confirm.disband',
      vi: 'Bạn có chắc chắn muốn giải tán nhóm? Các thành viên sẽ không còn được chuyển booking trong nhóm này.',
      en: 'Are you sure you want to disband this group? Members will no longer be able to transfer bookings within it.',
    },
    {
      namespace: 'therapistGroup',
      key: 'confirm.removeMember',
      vi: 'Bạn có chắc chắn muốn xóa {{name}} khỏi nhóm không?',
      en: 'Are you sure you want to remove {{name}} from the group?',
    },

    /**
     * ============================================================
     * THERAPIST BOOKING ACTIONS
     * ============================================================
     */
    {
      namespace: 'therapistBooking',
      key: 'actions.updateSuccess',
      vi: 'Cập nhật booking thành công.',
      en: 'Booking updated successfully.',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.rejectReasonLabel',
      vi: 'Lý do từ chối',
      en: 'Rejection reason',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.rejectReasonPlaceholder',
      vi: 'Nhập lý do...',
      en: 'Enter a reason...',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.confirmReject',
      vi: 'Xác nhận từ chối',
      en: 'Confirm rejection',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.cancel',
      vi: 'Hủy',
      en: 'Cancel',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.confirm',
      vi: 'Xác nhận',
      en: 'Confirm',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.reject',
      vi: 'Từ chối',
      en: 'Reject',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.transferInProgress',
      vi: 'Booking đang trong quy trình chuyển KTV. Bạn không nên xác nhận booking hiện tại trong lúc chờ xử lý.',
      en: 'This booking is currently being transferred to another therapist. Do not confirm the current booking while the transfer is being processed.',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.startTravel',
      vi: 'Bắt đầu di chuyển',
      en: 'Start traveling',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.arrived',
      vi: 'Đã đến nơi',
      en: 'Arrived',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.startService',
      vi: 'Bắt đầu dịch vụ',
      en: 'Start service',
    },
    {
      namespace: 'therapistBooking',
      key: 'actions.complete',
      vi: 'Hoàn thành',
      en: 'Complete',
    },

    /**
     * ============================================================
     * BOOKING TRANSFER
     * ============================================================
     */

    /**
     * Therapist transfer panel
     */
    {
      namespace: 'bookingTransfer',
      key: 'therapist.errors.selectTherapist',
      vi: 'Vui lòng chọn kỹ thuật viên.',
      en: 'Please select a therapist.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.messages.requestSent',
      vi: 'Đã gửi yêu cầu chuyển booking.',
      en: 'Booking transfer request sent.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.created.title',
      vi: 'Đã gửi yêu cầu chuyển',
      en: 'Transfer request sent',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.created.description',
      vi: 'Booking vẫn thuộc bạn cho đến khi KTV mới đồng ý, khách xác nhận và KTV mới nhận booking chính thức.',
      en: 'The booking remains assigned to you until the new therapist accepts the transfer request, the client approves the new therapist, and the new therapist officially accepts the booking.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.actions.open',
      vi: 'Chuyển KTV trong nhóm',
      en: 'Transfer within group',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.actions.manageGroup',
      vi: 'Quản lý nhóm KTV',
      en: 'Manage therapist group',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.actions.retry',
      vi: 'Thử lại',
      en: 'Try again',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.actions.sendRequest',
      vi: 'Gửi yêu cầu chuyển',
      en: 'Send transfer request',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.actions.close',
      vi: 'Đóng',
      en: 'Close',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.panel.title',
      vi: 'Chọn KTV trong nhóm',
      en: 'Select a therapist in the group',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.panel.description',
      vi: 'Chỉ KTV cùng nhóm và đủ điều kiện nhận toàn bộ dịch vụ của booking mới có thể được chọn.',
      en: 'Only therapists in the same group who are eligible to provide all services in this booking can be selected.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.fallbackName',
      vi: 'KTV #{{id}}',
      en: 'Therapist #{{id}}',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.completedBookings_one',
      vi: '{{count}} đơn hoàn thành',
      en: '{{count}} completed booking',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.completedBookings_other',
      vi: '{{count}} đơn hoàn thành',
      en: '{{count}} completed bookings',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.empty',
      vi: 'Không có KTV phù hợp trong nhóm.',
      en: 'No eligible therapist is available in this group.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.reason.label',
      vi: 'Lý do chuyển',
      en: 'Transfer reason',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.reason.placeholder',
      vi: 'Ví dụ: Tôi bị trùng lịch...',
      en: 'Example: I have a scheduling conflict...',
    },

    /**
     * Client pre-consent
     */
    {
      namespace: 'bookingTransfer',
      key: 'client.consent.title',
      vi: 'Cho phép chuyển KTV trong cùng nhóm',
      en: 'Allow therapist transfer within the same group',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.consent.description',
      vi: 'Nếu kỹ thuật viên bạn chọn không thể nhận lịch, kỹ thuật viên đó có thể đề nghị chuyển booking cho một kỹ thuật viên khác trong cùng nhóm. Bạn vẫn được xem và xác nhận kỹ thuật viên mới trước khi booking được chuyển.',
      en: 'If your selected therapist cannot take the appointment, they may propose transferring the booking to another therapist in the same group. You will still review and approve the replacement therapist before the transfer is completed.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.consent.checkbox',
      vi: 'Tôi đồng ý cho phép chuyển KTV trong cùng nhóm',
      en: 'I agree to allow therapist transfer within the same group',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.consent.notice',
      vi: 'Hệ thống không tự động chuyển. KTV hiện tại phải chủ động đề nghị và bạn sẽ xác nhận KTV thay thế.',
      en: 'The system will not transfer the booking automatically. Your current therapist must initiate the transfer and you will approve the replacement therapist.',
    },

    /**
     * Client transfer confirmation
     */
    {
      namespace: 'bookingTransfer',
      key: 'client.activeConsent.title',
      vi: 'Đã cho phép chuyển KTV trong nhóm',
      en: 'Group therapist transfer enabled',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.activeConsent.description',
      vi: 'Nếu KTV hiện tại không thể nhận lịch, bạn sẽ được xác nhận KTV thay thế trước khi booking được chuyển.',
      en: 'If your current therapist cannot take the appointment, you will approve the replacement therapist before the booking is transferred.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.waitingTherapist.title',
      vi: 'Đang chờ KTV được đề xuất xác nhận',
      en: 'Waiting for the proposed therapist',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.waitingTherapist.description',
      vi: '{{fromName}} đã đề nghị chuyển booking cho {{toName}}. Bạn chưa cần thao tác ở bước này.',
      en: '{{fromName}} proposed transferring the booking to {{toName}}. No action is required from you yet.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.confirm.title',
      vi: 'Xác nhận đổi kỹ thuật viên',
      en: 'Confirm therapist change',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.confirm.description',
      vi: '{{fromName}} không thể thực hiện booking và đề nghị chuyển cho một thành viên khác trong cùng nhóm.',
      en: '{{fromName}} cannot complete this booking and has proposed another therapist from the same group.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.confirm.proposedTherapist',
      vi: 'KTV được đề xuất',
      en: 'Proposed therapist',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.confirm.reason',
      vi: 'Lý do: {{reason}}',
      en: 'Reason: {{reason}}',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.confirm.accept',
      vi: 'Đồng ý với {{name}}',
      en: 'Approve {{name}}',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.confirm.reject',
      vi: 'Không đồng ý',
      en: 'Reject',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.messages.accepted',
      vi: 'Bạn đã đồng ý đổi kỹ thuật viên.',
      en: 'You approved the therapist change.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.messages.rejected',
      vi: 'Bạn đã từ chối kỹ thuật viên được đề xuất.',
      en: 'You rejected the proposed therapist.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.ready.title',
      vi: 'Bạn đã đồng ý với {{name}}',
      en: 'You approved {{name}}',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.ready.description',
      vi: 'Đang chờ {{name}} xác nhận nhận booking chính thức.',
      en: 'Waiting for {{name}} to officially accept the booking.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.completed.title',
      vi: 'Đã đổi kỹ thuật viên',
      en: 'Therapist changed',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.completed.description',
      vi: 'Booking hiện đã được {{name}} xác nhận nhận chính thức.',
      en: '{{name}} has officially accepted the booking.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'client.errors.persistConsent',
      vi: 'Booking đã được tạo nhưng chưa lưu được quyền chuyển KTV: {{message}}',
      en: 'The booking was created, but the therapist transfer consent could not be saved: {{message}}',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const item of this.translations) {
      await queryRunner.query(
        `
          INSERT INTO "i18n_resources"
          (
            "language_id",
            "namespace",
            "key",
            "value"
          )
          SELECT
            language.id,
            $1,
            $2,
            CASE
              WHEN language.code = 'vi' THEN $3
              WHEN language.code = 'en' THEN $4
            END
          FROM "i18n_languages" language
          WHERE language.code IN ('vi', 'en')
          ON CONFLICT (
            "language_id",
            "namespace",
            "key"
          )
          DO UPDATE SET
            "value" = EXCLUDED."value",
            "updated_at" = NOW()
        `,
        [item.namespace, item.key, item.vi, item.en],
      );
    }

    /**
     * Tăng revision để Web/App biết resource đã thay đổi
     * và tải lại translation mới từ Backend.
     */
    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const item of this.translations) {
      await queryRunner.query(
        `
          DELETE FROM "i18n_resources"
          WHERE "language_id" IN (
            SELECT "id"
            FROM "i18n_languages"
            WHERE "code" IN ('vi', 'en')
          )
          AND "namespace" = $1
          AND "key" = $2
        `,
        [item.namespace, item.key],
      );
    }

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
