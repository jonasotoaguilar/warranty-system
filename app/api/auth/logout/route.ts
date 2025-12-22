import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Priorizamos AUTHENTIK_URL (Server side) sobre NEXT_PUBLIC_
  const authentikUrl =
    process.env.AUTHENTIK_URL || process.env.NEXT_PUBLIC_AUTHENTIK_URL;
  const appUrl = new URL(request.url).origin;

  console.log(`[Logout Debug] App URL: ${appUrl}`);
  console.log(`[Logout Debug] Authentik URL Configured: ${authentikUrl}`);

  if (authentikUrl && authentikUrl.startsWith("http")) {
    // Forzamos el flujo de invalidación global de Authentik
    const destination = `${authentikUrl}/if/flow/default-invalidation-flow/?next=${appUrl}`;
    console.log(`[Logout Debug] Redirecting to: ${destination}`);
    return NextResponse.redirect(destination);
  }

  // Fallback extremadamente simple si no hay URL
  console.log(`[Logout Debug] No Authentik URL, falling back to outpost...`);
  return NextResponse.redirect(`${appUrl}/outpost.goauthentik.io/auth/logout`);
}
