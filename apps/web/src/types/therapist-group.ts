export type TherapistGroupMemberRole = "owner" | "member";

export type TherapistGroupMember = {
  id: number;

  therapistId: number;

  role: TherapistGroupMemberRole;

  stageName?: string | null;

  fullName?: string | null;

  phone?: string | null;

  verificationStatus?: string;

  isAcceptingBookings?: boolean;

  onlineStatus?: string;
};

export type TherapistGroup = {
  id: number;

  name: string;

  description?: string | null;

  ownerTherapistId: number;

  isActive: boolean;

  myRole: TherapistGroupMemberRole | null;

  members: TherapistGroupMember[];
};

export type MyTherapistGroupResponse = {
  group: TherapistGroup | null;
};

export type TherapistGroupInvitation = {
  id: number;

  group: {
    id: number;

    name: string;

    description?: string | null;
  };

  invitedBy: {
    therapistId: number;

    stageName?: string | null;

    fullName?: string | null;
  };

  status: string;

  createdAt: string;
};

export type TherapistGroupInvitationsResponse = {
  items: TherapistGroupInvitation[];
};

export type TherapistGroupCandidate = {
  therapistId: number;

  stageName?: string | null;

  fullName?: string | null;

  phone?: string | null;

  ratingAverage: number;

  ratingCount: number;

  completedBookings: number;
};

export type TherapistGroupCandidatesResponse = {
  items: TherapistGroupCandidate[];
};

export type CreateTherapistGroupPayload = {
  name: string;

  description?: string;
};
