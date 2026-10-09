"use client";

import {
  ArrowRightLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Layers3,
  LogOut,
  MapPin,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { PageContainer } from "@/components/ui/PageContainer";

import {
  acceptTransferredBooking,
  getIncomingBookingTransfers,
  respondTherapistBookingTransfer,
} from "@/lib/booking-transfers";

import { getApiErrorMessage } from "@/lib/http";

import {
  createTherapistGroup,
  disbandTherapistGroup,
  getMyGroupInvitations,
  getMyTherapistGroup,
  inviteTherapistToGroup,
  leaveTherapistGroup,
  removeTherapistGroupMember,
  respondGroupInvitation,
  searchTherapistGroupCandidates,
} from "@/lib/therapist-groups";

import { BookingTherapistTransferStatus } from "@/types/booking-transfer";

const getTherapistName = (
  therapist:
    | {
        therapistId: number;

        stageName?: string | null;

        fullName?: string | null;
      }
    | undefined
) => {
  if (!therapist) {
    return "";
  }

  return (
    therapist.stageName || therapist.fullName || `#${therapist.therapistId}`
  );
};

export default function TherapistGroupPage() {
  const { t, i18n } = useTranslation("therapistGroup");

  const queryClient = useQueryClient();

  const language = (i18n.resolvedLanguage ?? i18n.language ?? "vi")

    .split("-")[0]
    .toLowerCase();

  const locale = language === "en" ? "en-US" : "vi-VN";

  const formatTransferDateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",

      timeStyle: "short",
    }).format(new Date(value));

  const formatTransferDuration = (minutes: number) =>
    t("transfers.booking.durationMinutes", {
      count: Number(minutes ?? 0),
    });

  const [groupName, setGroupName] = useState("");

  const [groupDescription, setGroupDescription] = useState("");

  const [searchText, setSearchText] = useState("");

  /**

   * ==========================================================

   * MY GROUP

   * ==========================================================

   */

  const {
    data: groupResponse,

    isLoading: loadingGroup,

    isError: groupError,

    error: groupQueryError,

    refetch: refetchGroup,

    isFetching: fetchingGroup,
  } = useQuery({
    queryKey: ["therapist-group"],

    queryFn: getMyTherapistGroup,
  });

  const group = groupResponse?.group ?? null;

  /**

   * ==========================================================

   * INVITATIONS

   * ==========================================================

   */

  const { data: invitationsResponse } = useQuery({
    queryKey: ["therapist-group-invitations"],

    queryFn: getMyGroupInvitations,

    refetchInterval: 10000,
  });

  const invitations = invitationsResponse?.items ?? [];

  /**

   * ==========================================================

   * INCOMING BOOKING TRANSFERS

   * ==========================================================

   */

  const {
    data: incomingResponse,

    isLoading: loadingIncoming,
  } = useQuery({
    queryKey: ["therapist-booking-transfers", "incoming"],

    queryFn: getIncomingBookingTransfers,

    refetchInterval: 5000,
  });

  const incomingTransfers = incomingResponse?.items ?? [];

  /**

   * ==========================================================

   * SEARCH MEMBER

   * ==========================================================

   */

  const candidateQueryEnabled = Boolean(group) && searchText.trim().length >= 2;

  const {
    data: candidatesResponse,

    isFetching: searchingCandidates,
  } = useQuery({
    queryKey: ["therapist-group-candidates", searchText],

    queryFn: () => searchTherapistGroupCandidates(searchText),

    enabled: candidateQueryEnabled,
  });

  const candidates = candidatesResponse?.items ?? [];

  /**

   * ==========================================================

   * CREATE GROUP

   * ==========================================================

   */

  const createMutation = useMutation({
    mutationFn: () =>
      createTherapistGroup({
        name: groupName.trim(),

        description: groupDescription.trim() || undefined,
      }),

    onSuccess: () => {
      setGroupName("");

      setGroupDescription("");

      toast.success(t("messages.groupCreated"));

      void queryClient.invalidateQueries({
        queryKey: ["therapist-group"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**

   * ==========================================================

   * RESPOND GROUP INVITATION

   * ==========================================================

   */

  const invitationMutation = useMutation({
    mutationFn: (input: {
      invitationId: number;

      action: "accept" | "reject";
    }) => respondGroupInvitation(input.invitationId, input.action),

    onSuccess: (_result, variables) => {
      toast.success(
        variables.action === "accept"
          ? t("messages.invitationAccepted")
          : t("messages.invitationRejected")
      );

      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["therapist-group"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["therapist-group-invitations"],
        }),
      ]);
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**

   * ==========================================================

   * INVITE MEMBER

   * ==========================================================

   */

  const inviteMutation = useMutation({
    mutationFn: (therapistId: number) => {
      if (!group) {
        throw new Error(t("errors.groupNotFound"));
      }

      return inviteTherapistToGroup(group.id, therapistId);
    },

    onSuccess: () => {
      toast.success(t("messages.invitationSent"));
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**

   * ==========================================================

   * REMOVE MEMBER

   * ==========================================================

   */

  const removeMemberMutation = useMutation({
    mutationFn: (therapistId: number) => {
      if (!group) {
        throw new Error(t("errors.groupNotFound"));
      }

      return removeTherapistGroupMember(group.id, therapistId);
    },

    onSuccess: () => {
      toast.success(t("messages.memberRemoved"));

      void queryClient.invalidateQueries({
        queryKey: ["therapist-group"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**

   * ==========================================================

   * LEAVE GROUP

   * ==========================================================

   */

  const leaveMutation = useMutation({
    mutationFn: leaveTherapistGroup,

    onSuccess: () => {
      toast.success(t("messages.groupLeft"));

      void queryClient.invalidateQueries({
        queryKey: ["therapist-group"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**

   * ==========================================================

   * DISBAND GROUP

   * ==========================================================

   */

  const disbandMutation = useMutation({
    mutationFn: () => {
      if (!group) {
        throw new Error(t("errors.groupNotFound"));
      }

      return disbandTherapistGroup(group.id);
    },

    onSuccess: () => {
      toast.success(t("messages.groupDisbanded"));

      void queryClient.invalidateQueries({
        queryKey: ["therapist-group"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**

   * ==========================================================

   * B RESPONDS TO TRANSFER

   * ==========================================================

   */

  const transferRespondMutation = useMutation({
    mutationFn: (input: {
      transferId: number;

      accepted: boolean;
    }) =>
      respondTherapistBookingTransfer(input.transferId, {
        accepted: input.accepted,
      }),

    onSuccess: (_result, variables) => {
      toast.success(
        variables.accepted
          ? t("messages.transferAccepted")
          : t("messages.transferRejected")
      );

      void queryClient.invalidateQueries({
        queryKey: ["therapist-booking-transfers", "incoming"],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**

   * ==========================================================

   * B FINAL ACCEPT

   * ==========================================================

   */

  const finalAcceptMutation = useMutation({
    mutationFn: (transferId: number) => acceptTransferredBooking(transferId),

    onSuccess: () => {
      toast.success(t("messages.bookingAccepted"));

      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["therapist-booking-transfers", "incoming"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["therapist-bookings"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["therapist-dashboard-bookings"],
        }),
      ]);
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const groupMemberIds = useMemo(
    () => new Set(group?.members.map((member) => member.therapistId) ?? []),

    [group]
  );

  const isOwner = group?.myRole === "owner";

  /**

   * ==========================================================

   * LOADING

   * ==========================================================

   */

  if (loadingGroup) {
    return (
      <PageContainer className="py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />

          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </PageContainer>
    );
  }

  /**

   * ==========================================================

   * ERROR

   * ==========================================================

   */

  if (groupError) {
    return (
      <PageContainer className="py-8">
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <RefreshCcw className="size-9 text-red-500" />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            {t("loadError.title")}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {getApiErrorMessage(groupQueryError)}
          </p>

          <Button
            className="mt-5"
            loading={fetchingGroup}
            onClick={() => void refetchGroup()}
          >
            {t("actions.retry")}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {t("description")}
        </p>
      </div>

      {/* ===================================================== */}

      {/* INCOMING BOOKING TRANSFERS */}

      {/* ===================================================== */}

      <section className="mt-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ArrowRightLeft className="size-5 text-blue-700" />

          <h2 className="text-lg font-bold text-slate-950">
            {t("transfers.title")}
          </h2>

          {incomingTransfers.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
              {incomingTransfers.length}
            </span>
          )}
        </div>

        {loadingIncoming ? (
          <Card className="p-5">
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </Card>
        ) : incomingTransfers.length === 0 ? (
          <Card className="p-5">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <CheckCircle2 className="size-5 text-emerald-600" />

              {t("transfers.empty")}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {incomingTransfers.map((transfer) => {
              const fromName = getTherapistName(transfer.fromTherapist);

              const status = transfer.status;

              const booking = transfer.booking ?? null;

              return (
                <Card key={transfer.id} className="p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="font-bold text-slate-950">
                          {t("transfers.bookingNumber", {
                            id: transfer.bookingId,
                          })}
                        </div>

                        {status ===
                          BookingTherapistTransferStatus.PENDING_THERAPIST && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {t("transfers.status.pendingTherapist")}
                          </span>
                        )}

                        {status ===
                          BookingTherapistTransferStatus.PENDING_CLIENT && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {t("transfers.status.pendingClient")}
                          </span>
                        )}

                        {status ===
                          BookingTherapistTransferStatus.READY_TO_ACCEPT && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {t("transfers.status.readyToAccept")}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                        <UserRound className="size-4 shrink-0 text-emerald-700" />

                        <span>
                          {t("transfers.fromTherapist", {
                            name: fromName,
                          })}
                        </span>
                      </div>

                      {transfer.group && (
                        <div className="mt-2 text-xs text-slate-400">
                          {t("transfers.group", {
                            name: transfer.group.name,
                          })}
                        </div>
                      )}

                      {transfer.reason && (
                        <div className="mt-2 text-sm text-slate-500">
                          {t("transfers.reason", {
                            reason: transfer.reason,
                          })}
                        </div>
                      )}

                      {booking && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            {t("transfers.booking.detailsTitle")}
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="flex items-start gap-2.5">
                              <CalendarDays className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                              <div className="min-w-0">
                                <div className="text-xs text-slate-400">
                                  {t("transfers.booking.time")}
                                </div>

                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                  {formatTransferDateTime(booking.scheduledAt)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <Clock3 className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                              <div className="min-w-0">
                                <div className="text-xs text-slate-400">
                                  {t("transfers.booking.duration")}
                                </div>

                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                  {formatTransferDuration(
                                    booking.durationMinutes
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 md:col-span-2">
                              <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                              <div className="min-w-0">
                                <div className="text-xs text-slate-400">
                                  {t("transfers.booking.address")}
                                </div>

                                <div className="mt-1 break-words text-sm font-semibold text-slate-900">
                                  {booking.address}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 md:col-span-2">
                              <Layers3 className="mt-0.5 size-4 shrink-0 text-emerald-700" />

                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-slate-400">
                                  {t("transfers.booking.services")}
                                </div>

                                <div className="mt-2 space-y-2">
                                  {booking.items.map((item) => (
                                    <div
                                      key={`${transfer.id}-${item.id}-${item.sortOrder}`}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                                    >
                                      <div className="text-sm font-semibold text-slate-900">
                                        {item.serviceName}
                                      </div>

                                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                        {item.optionLabel && (
                                          <span>{item.optionLabel}</span>
                                        )}

                                        <span>
                                          {formatTransferDuration(
                                            item.durationMinutes
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {status ===
                        BookingTherapistTransferStatus.PENDING_CLIENT && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-700">
                          <Clock3 className="mt-0.5 size-4 shrink-0" />

                          {t("transfers.waitingClient")}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {status ===
                        BookingTherapistTransferStatus.PENDING_THERAPIST && (
                        <>
                          <Button
                            loading={transferRespondMutation.isPending}
                            disabled={transferRespondMutation.isPending}
                            onClick={() =>
                              transferRespondMutation.mutate({
                                transferId: transfer.id,

                                accepted: true,
                              })
                            }
                          >
                            <Check className="size-4" />

                            {t("actions.acceptTransfer")}
                          </Button>

                          <Button
                            variant="outline"
                            disabled={transferRespondMutation.isPending}
                            onClick={() =>
                              transferRespondMutation.mutate({
                                transferId: transfer.id,

                                accepted: false,
                              })
                            }
                            className="text-red-600"
                          >
                            <X className="size-4" />

                            {t("actions.reject")}
                          </Button>
                        </>
                      )}

                      {status ===
                        BookingTherapistTransferStatus.READY_TO_ACCEPT && (
                        <Button
                          loading={finalAcceptMutation.isPending}
                          disabled={finalAcceptMutation.isPending}
                          onClick={() =>
                            finalAcceptMutation.mutate(transfer.id)
                          }
                        >
                          <CheckCircle2 className="size-4" />

                          {t("actions.acceptBooking")}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ===================================================== */}

      {/* INVITATIONS */}

      {/* ===================================================== */}

      {invitations.length > 0 && (
        <section className="mt-7">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="size-5 text-emerald-700" />

            <h2 className="text-lg font-bold text-slate-950">
              {t("invitations.title")}
            </h2>
          </div>

          <div className="grid gap-4">
            {invitations.map((invitation) => {
              const inviterName =
                invitation.invitedBy.stageName ||
                invitation.invitedBy.fullName ||
                `#${invitation.invitedBy.therapistId}`;

              return (
                <Card key={invitation.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-bold text-slate-950">
                        {invitation.group.name}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {t("invitations.invitedBy", {
                          name: inviterName,
                        })}
                      </p>

                      {invitation.group.description && (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {invitation.group.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        loading={invitationMutation.isPending}
                        onClick={() =>
                          invitationMutation.mutate({
                            invitationId: invitation.id,

                            action: "accept",
                          })
                        }
                      >
                        <Check className="size-4" />

                        {t("actions.join")}
                      </Button>

                      <Button
                        variant="outline"
                        disabled={invitationMutation.isPending}
                        onClick={() =>
                          invitationMutation.mutate({
                            invitationId: invitation.id,

                            action: "reject",
                          })
                        }
                        className="text-red-600"
                      >
                        <X className="size-4" />

                        {t("actions.reject")}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================== */}

      {/* NO GROUP */}

      {/* ===================================================== */}

      {!group && (
        <section className="mt-7">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <UsersRound className="size-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {t("create.title")}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {t("create.description")}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label
                  htmlFor="groupName"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t("create.name")}
                </label>

                <input
                  id="groupName"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  maxLength={120}
                  placeholder={t("create.namePlaceholder")}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              <div>
                <label
                  htmlFor="groupDescription"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t("create.descriptionLabel")}
                </label>

                <textarea
                  id="groupDescription"
                  rows={4}
                  value={groupDescription}
                  onChange={(event) => setGroupDescription(event.target.value)}
                  maxLength={2000}
                  placeholder={t("create.descriptionPlaceholder")}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              <Button
                disabled={!groupName.trim() || createMutation.isPending}
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="w-full sm:w-fit"
              >
                <UsersRound className="size-4" />

                {t("actions.createGroup")}
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* ===================================================== */}

      {/* CURRENT GROUP */}

      {/* ===================================================== */}

      {group && (
        <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UsersRound className="size-5 shrink-0 text-emerald-700" />

                    <h2 className="truncate text-xl font-bold text-slate-950">
                      {group.name}
                    </h2>
                  </div>

                  {group.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {group.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {t("group.memberCount", {
                        count: group.members.length,
                      })}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {isOwner
                        ? t("group.roles.owner")
                        : t("group.roles.member")}
                    </span>
                  </div>
                </div>

                {isOwner ? (
                  <Button
                    variant="outline"
                    disabled={disbandMutation.isPending}
                    loading={disbandMutation.isPending}
                    className="text-red-600"
                    onClick={() => {
                      const confirmed = window.confirm(t("confirm.disband"));

                      if (confirmed) {
                        disbandMutation.mutate();
                      }
                    }}
                  >
                    <Trash2 className="size-4" />

                    {t("actions.disband")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={leaveMutation.isPending}
                    loading={leaveMutation.isPending}
                    className="text-red-600"
                    onClick={() => {
                      const confirmed = window.confirm(t("confirm.leave"));

                      if (confirmed) {
                        leaveMutation.mutate();
                      }
                    }}
                  >
                    <LogOut className="size-4" />

                    {t("actions.leave")}
                  </Button>
                )}
              </div>
            </Card>

            {/* MEMBERS */}

            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {t("members.title")}
              </h2>

              <div className="mt-5 divide-y divide-slate-100">
                {group.members.map((member) => {
                  const name =
                    member.stageName ||
                    member.fullName ||
                    `#${member.therapistId}`;

                  const memberIsOwner = member.role === "owner";

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <UserRound className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-slate-900">
                            {name}
                          </span>

                          {memberIsOwner && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              {t("group.roles.owner")}
                            </span>
                          )}
                        </div>

                        {member.phone && (
                          <div className="mt-1 text-xs text-slate-400">
                            {member.phone}
                          </div>
                        )}

                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          {member.verificationStatus && (
                            <span className="text-slate-500">
                              {member.verificationStatus}
                            </span>
                          )}

                          {member.isAcceptingBookings !== undefined && (
                            <span
                              className={
                                member.isAcceptingBookings
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }
                            >
                              {member.isAcceptingBookings
                                ? t("members.acceptingBookings")
                                : t("members.notAcceptingBookings")}
                            </span>
                          )}
                        </div>
                      </div>

                      {isOwner && !memberIsOwner && (
                        <button
                          type="button"
                          disabled={removeMemberMutation.isPending}
                          onClick={() => {
                            const confirmed = window.confirm(
                              t("confirm.removeMember", {
                                name,
                              })
                            );

                            if (confirmed) {
                              removeMemberMutation.mutate(member.therapistId);
                            }
                          }}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title={t("actions.removeMember")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ================================================= */}

          {/* INVITE MEMBER */}

          {/* ================================================= */}

          <aside>
            <Card className="p-5 sm:p-6 xl:sticky xl:top-24">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 text-emerald-700" />

                <h2 className="text-lg font-bold text-slate-950">
                  {t("search.title")}
                </h2>
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {t("search.description")}
              </p>

              <div className="relative mt-5">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={t("search.placeholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              {searchText.trim().length > 0 && searchText.trim().length < 2 && (
                <p className="mt-2 text-xs text-slate-400">
                  {t("search.minimumCharacters")}
                </p>
              )}

              {searchingCandidates && (
                <div className="mt-4 space-y-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-xl bg-slate-100"
                    />
                  ))}
                </div>
              )}

              {!searchingCandidates && candidateQueryEnabled && (
                <div className="mt-4 space-y-2">
                  {candidates.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                      {t("search.empty")}
                    </div>
                  ) : (
                    candidates.map((candidate) => {
                      const name =
                        candidate.stageName ||
                        candidate.fullName ||
                        `#${candidate.therapistId}`;

                      const alreadyMember = groupMemberIds.has(
                        candidate.therapistId
                      );

                      return (
                        <div
                          key={candidate.therapistId}
                          className="rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                              <UserRound className="size-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900">
                                {name}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Star className="size-3.5" />

                                  {Number(candidate.ratingAverage ?? 0).toFixed(
                                    1
                                  )}
                                </span>

                                <span>
                                  {t("search.completedBookings", {
                                    count: candidate.completedBookings,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="mt-3 w-full"
                            disabled={alreadyMember || inviteMutation.isPending}
                            loading={inviteMutation.isPending}
                            onClick={() =>
                              inviteMutation.mutate(candidate.therapistId)
                            }
                          >
                            <UserPlus className="size-4" />

                            {alreadyMember
                              ? t("search.alreadyMember")
                              : t("actions.invite")}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
