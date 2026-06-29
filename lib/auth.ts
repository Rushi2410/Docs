import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { assertSafeJwtSecret, env } from "@/lib/env";

const AUTH_COOKIE = "docs_session";

export type AuthSession = {
  id: string;
  email: string;
  name: string;
};

export function signAuthToken(session: AuthSession) {
  assertSafeJwtSecret();

  return jwt.sign(session, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string) {
  assertSafeJwtSecret();
  return jwt.verify(token, env.JWT_SECRET) as AuthSession;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

export function attachAuthCookie(response: NextResponse, session: AuthSession) {
  response.cookies.set(AUTH_COOKIE, signAuthToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function parseCookieHeader(cookieHeader?: string | null) {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").map((segment) => {
      const [key, ...rest] = segment.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

export function getUserFromCookieHeader(cookieHeader?: string | null) {
  try {
    const cookiesMap = parseCookieHeader(cookieHeader);
    const token = cookiesMap[AUTH_COOKIE];
    return token ? verifyAuthToken(token) : null;
  } catch {
    return null;
  }
}
