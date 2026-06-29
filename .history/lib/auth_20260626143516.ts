import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("offline_docs_token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
  } catch {
    return null;
  }
}