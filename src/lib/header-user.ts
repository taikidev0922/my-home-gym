import { getCurrentAuthUser } from "@/lib/auth-user";
import { getProfile } from "@/lib/gym-repository";

export type HeaderUserData = {
  email: string;
  name: string;
  avatarUrl: string;
} | null;

export async function getHeaderUser(): Promise<HeaderUserData> {
  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const profile = await getProfile(user.id, user.email, user.name, user.avatarUrl);

  return {
    email: user.email,
    name: profile.displayName,
    avatarUrl: profile.avatarUrl || user.avatarUrl,
  };
}
