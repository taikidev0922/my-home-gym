import { auth0 } from "@/lib/auth0";

export type CurrentAuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
};

export async function getCurrentAuthUser(): Promise<CurrentAuthUser | null> {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user?.sub) {
    return null;
  }

  const email = typeof user.email === "string" ? user.email : "";
  const name =
    (typeof user.name === "string" && user.name.trim()) ||
    (typeof user.nickname === "string" && user.nickname.trim()) ||
    email.split("@")[0] ||
    "ユーザー";
  const avatarUrl = typeof user.picture === "string" ? user.picture : "";

  return {
    id: user.sub,
    email,
    name,
    avatarUrl,
  };
}
