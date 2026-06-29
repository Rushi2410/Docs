import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/urls";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", getRequestOrigin(request)), {
    status: 303,
  });
  clearAuthCookie(response);
  return response;
}
