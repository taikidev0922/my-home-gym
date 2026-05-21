import { auth0 } from "@/lib/auth0";

export const defaultDisplayName = "匿名";
export const defaultAvatarUrl = "/brand/default-user.webp";

export type CurrentAuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
};

export async function getCurrentAuthUser(): Promise<CurrentAuthUser | null> {
  if (!auth0) {
    return null;
  }

  const session = await auth0.getSession().catch(() => null);
  const user = session?.user;

  if (!user?.sub) {
    return null;
  }

  const email = typeof user.email === "string" ? user.email : "";

  return {
    id: user.sub,
    email,
    name: defaultDisplayName,
    avatarUrl: defaultAvatarUrl,
  };
}
