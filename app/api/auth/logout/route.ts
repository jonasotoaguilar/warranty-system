import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const appUrl = new URL(request.url).origin;

  const logoutUrl = `/outpost.goauthentik.io/auth/logout?rd=${encodeURIComponent(
    appUrl
  )}`;

  return NextResponse.redirect(logoutUrl);
}
