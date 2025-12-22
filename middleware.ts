import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Verificamos múltiples cabeceras que Authentik puede enviar.
  // Algunos proxys usan x-authentik-uid, otros x-authentik-username o remote-user.
  const userId = request.headers.get("x-authentik-uid");
  const username = request.headers.get("x-authentik-username");
  const remoteUser = request.headers.get("remote-user");

  // Si no hay ninguna cabecera de identificación, devolvemos 401.
  if (!userId && !username && !remoteUser) {
    return new NextResponse("Unauthorized - No Auth Headers found", {
      status: 401,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg, png, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
