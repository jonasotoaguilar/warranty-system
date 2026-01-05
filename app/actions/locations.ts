"use server";

import { databases, COLLECTIONS, DB_ID, Query, ID } from "@/lib/appwrite";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { normalizeString } from "@/lib/utils";

export async function getLocations(onlyActive = false) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const queries = [
      Query.equal("userId", user.id),
      Query.orderDesc("createdAt"),
    ];

    if (onlyActive) {
      queries.push(Query.equal("isActive", true));
    }

    const locationsResult = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      queries
    );

    const locations = locationsResult.documents.map((doc: any) => ({
      ...doc,
      id: doc.$id,
    }));

    // Enriquecer con conteos
    const enrichedLocations = await Promise.all(
      locations.map(async (loc) => {
        const activePromise = databases.listDocuments(
          DB_ID,
          COLLECTIONS.WARRANTIES,
          [
            Query.equal("userId", user.id),
            Query.equal("locationId", loc.id),
            Query.equal("status", ["pending", "ready"]),
            Query.limit(1), // Get total only
          ]
        );

        const completedPromise = databases.listDocuments(
          DB_ID,
          COLLECTIONS.WARRANTIES,
          [
            Query.equal("userId", user.id),
            Query.equal("locationId", loc.id),
            Query.equal("status", "completed"),
            Query.limit(1), // Get total only
          ]
        );

        const logsPromise = databases.listDocuments(
          DB_ID,
          COLLECTIONS.LOCATION_LOGS,
          [
            Query.or([
              Query.equal("fromLocationId", loc.id),
              Query.equal("toLocationId", loc.id),
            ]),
            Query.limit(1), // Get total only
          ]
        );

        const [activeRes, completedRes, logsRes] = await Promise.all([
          activePromise,
          completedPromise,
          logsPromise,
        ]);

        const activeCount = activeRes.total;
        const completedCount = completedRes.total;
        const hasLogs = logsRes.total;

        const hasHistory = activeCount > 0 || completedCount > 0 || hasLogs > 0;

        return {
          ...loc,
          activeCount,
          completedCount,
          hasHistory,
        };
      })
    );

    return { data: enrichedLocations };
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return { error: "Error al cargar ubicaciones" };
  }
}

export async function createLocation(prevState: any, formData: FormData) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    return { error: "El nombre es requerido" };
  }

  try {
    const normalizedNew = normalizeString(name);

    // Obtener todas las ubicaciones del usuario para comparar
    const existingResult = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      [Query.equal("userId", user.id), Query.limit(100)]
    );

    const isDuplicate = existingResult.documents.some(
      (loc: any) => normalizeString(loc.name) === normalizedNew
    );

    if (isDuplicate) {
      return { error: "Ya existe una ubicación con este nombre (o similar)" };
    }

    await databases.createDocument(DB_ID, COLLECTIONS.LOCATIONS, ID.unique(), {
      name: name.trim(),
      userId: user.id,
      isActive: true, // Default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/locations");
    return { success: true, message: "Ubicación creada correctamente" };
  } catch (error: any) {
    console.error("Error creating location:", error);
    return { error: "Error al crear la ubicación" };
  }
}

export async function toggleLocationActive(id: string, active: boolean) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.LOCATIONS, id);
    if (doc.userId !== user.id) {
      return { error: "No autorizado" };
    }

    await databases.updateDocument(DB_ID, COLLECTIONS.LOCATIONS, id, {
      isActive: active,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    console.error("Error toggling location active:", error);
    return { error: "Error al actualizar la ubicación" };
  }
}

export async function deleteLocation(id: string, name: string) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    // Verificar si la ubicación pertenece al usuario
    const location = await databases.getDocument(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      id
    );

    if (!location || location.userId !== user.id) {
      return { error: "Ubicación no encontrada" };
    }

    // Validar si está en uso en cualquier garantía (cualquier status)
    const warrantiesRes = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.WARRANTIES,
      [
        Query.equal("userId", user.id),
        Query.equal("locationId", id),
        Query.limit(1), // Just check total
      ]
    );

    const logsRes = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATION_LOGS,
      [
        Query.or([
          Query.equal("fromLocationId", id),
          Query.equal("toLocationId", id),
        ]),
        Query.limit(1),
      ]
    );

    if (warrantiesRes.total > 0 || logsRes.total > 0) {
      return {
        error:
          "No se puede eliminar una ubicación con historial de garantías o movimientos.",
      };
    }

    await databases.deleteDocument(DB_ID, COLLECTIONS.LOCATIONS, id);
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { error: "Error al eliminar la ubicación" };
  }
}
