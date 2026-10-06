import { apiFetch } from "@/lib/http";

import type {
  CreateTherapistGroupPayload,
  MyTherapistGroupResponse,
  TherapistGroup,
  TherapistGroupCandidatesResponse,
  TherapistGroupInvitationsResponse,
} from "@/types/therapist-group";

const ENDPOINTS = {
  me: "/therapist/groups/me",

  candidates: "/therapist/groups/candidates",

  invitations: "/therapist/groups/invitations",

  create: "/therapist/groups",

  invite: (groupId: number) => `/therapist/groups/${groupId}/invitations`,

  invitationRespond: (invitationId: number) =>
    `/therapist/groups/invitations/${invitationId}/respond`,

  leave: "/therapist/groups/me/leave",

  removeMember: (groupId: number, therapistId: number) =>
    `/therapist/groups/${groupId}/members/${therapistId}`,

  disband: (groupId: number) => `/therapist/groups/${groupId}`,
};

export const getMyTherapistGroup = () => {
  return apiFetch<MyTherapistGroupResponse>(ENDPOINTS.me);
};

export const createTherapistGroup = (payload: CreateTherapistGroupPayload) => {
  return apiFetch<{
    group: TherapistGroup;
  }>(ENDPOINTS.create, {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const searchTherapistGroupCandidates = (q?: string) => {
  const params = new URLSearchParams();

  if (q?.trim()) {
    params.set("q", q.trim());
  }

  const query = params.toString();

  return apiFetch<TherapistGroupCandidatesResponse>(
    `${ENDPOINTS.candidates}${query ? `?${query}` : ""}`
  );
};

export const inviteTherapistToGroup = (
  groupId: number,
  therapistId: number
) => {
  return apiFetch(ENDPOINTS.invite(groupId), {
    method: "POST",

    body: JSON.stringify({
      therapistId,
    }),
  });
};

export const getMyGroupInvitations = () => {
  return apiFetch<TherapistGroupInvitationsResponse>(ENDPOINTS.invitations);
};

export const respondGroupInvitation = (
  invitationId: number,
  action: "accept" | "reject"
) => {
  return apiFetch(ENDPOINTS.invitationRespond(invitationId), {
    method: "PATCH",

    body: JSON.stringify({
      action,
    }),
  });
};

export const leaveTherapistGroup = () => {
  return apiFetch(ENDPOINTS.leave, {
    method: "DELETE",
  });
};

export const removeTherapistGroupMember = (
  groupId: number,
  therapistId: number
) => {
  return apiFetch(ENDPOINTS.removeMember(groupId, therapistId), {
    method: "DELETE",
  });
};

export const disbandTherapistGroup = (groupId: number) => {
  return apiFetch(ENDPOINTS.disband(groupId), {
    method: "DELETE",
  });
};
