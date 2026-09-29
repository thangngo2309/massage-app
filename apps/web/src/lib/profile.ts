import { apiFetch } from "@/lib/http";

export type AvatarResponse = {
  avatarUrl: string | null;
};

export const uploadAvatar = (file: File) => {
  const formData = new FormData();

  formData.append("avatar", file);

  return apiFetch<AvatarResponse>("/profile/avatar", {
    method: "POST",
    body: formData,
  });
};

export const deleteAvatar = () => {
  return apiFetch<AvatarResponse>("/profile/avatar", {
    method: "DELETE",
  });
};
