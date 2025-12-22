import { headers } from "next/headers";

interface AuthentikUser {
  id: string;
  email: string | null;
  name: string;
  username: string;
}

/**
 * Obtiene el usuario autenticado desde las cabeceras inyectadas por Authentik Proxy Provider.
 * Traefik/Dokploy inyectan estas cabeceras tras una autenticación exitosa.
 */
export async function getAuthUser(): Promise<AuthentikUser | null> {
  const headersList = await headers();

  // Lista de headers posibles según configuración de Authentik/Traefik
  const userId =
    headersList.get("x-authentik-uid") || headersList.get("remote-user");
  const email =
    headersList.get("x-authentik-email") || headersList.get("remote-email");
  const name =
    headersList.get("x-authentik-name") || headersList.get("remote-name");
  const username =
    headersList.get("x-authentik-username") || headersList.get("remote-user");

  console.log(`[Auth Debug] Headers: ${JSON.stringify(headersList)}`);

  if (!userId && !username) {
    return null;
  }

  return {
    id: userId || username || "unknown",
    email: email,
    name: name || username || "Usuario",
    username: username || userId || "usuario",
  };
}
