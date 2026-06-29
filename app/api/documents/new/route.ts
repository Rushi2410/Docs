import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/urls";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/dashboard", getRequestOrigin(request)));
}
