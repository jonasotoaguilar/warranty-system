import { databases, COLLECTIONS, DB_ID, Query, ID } from "@/lib/appwrite";
import { Warranty, WarrantyStatus } from "./types";

// Helper to convert Appwrite document to Warranty type
function mapToWarranty(
  item: any,
  locMap: Map<string, any>,
  logs: any[] = []
): Warranty {
  const locationName = locMap.get(item.locationId)?.name || "Sin ubicación";

  // Sort logs for this warranty
  const warrantyLogs = logs
    .filter((l) => l.warrantyId === item.$id)
    .sort(
      (a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    )
    .map((log) => ({
      ...log,
      id: log.$id,
      fromLocation: locMap.get(log.fromLocationId)?.name || "Desconocido",
      toLocation: locMap.get(log.toLocationId)?.name || "Desconocido",
      changedAt: log.changedAt, // Already string in Appwrite
    }));

  return {
    ...item,
    id: item.$id, // Map $id to id
    location: locationName,
    entryDate: item.entryDate,
    deliveryDate: item.deliveryDate || undefined,
    readyDate: item.readyDate || undefined,
    status: item.status as WarrantyStatus,
    locationLogs: warrantyLogs,
  };
}

export async function getWarranties(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: WarrantyStatus[];
  location?: string;
  userId?: string;
}): Promise<{ data: Warranty[]; total: number; page: number; limit: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const queries: string[] = [
    Query.limit(limit),
    Query.offset(offset),
    Query.orderDesc("entryDate"),
  ];

  if (params?.userId) {
    queries.push(Query.equal("userId", params.userId));
  }

  if (params?.status && params.status.length > 0) {
    queries.push(Query.equal("status", params.status));
  }

  if (params?.location) {
    queries.push(Query.equal("locationId", params.location));
  }

  if (params?.search) {
    const search = params.search;
    // Note: 'search' requires FullText index
    // 'starsWith' works on Key index
    queries.push(
      Query.or([
        Query.search("clientName", search),
        Query.startsWith("invoiceNumber", search),
        Query.startsWith("rut", search),
      ])
    );
  }

  try {
    const result = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.WARRANTIES,
      queries
    ); // Casting query array to any[] if TS complains, but string[] is correct for SDK

    if (result.documents.length === 0) {
      return { data: [], total: result.total, page, limit };
    }

    // Batch Fetch Relations
    const warrantyIds = result.documents.map((d) => d.$id);

    // 1. Fetch Logs for these warranties
    // Limit logs? If a warranty has 100 logs, fetching all might be too much,
    // but usually they have few. Let's fetch reasonably.
    // We can't easily limit "per parent" in one query.
    // We'll fetch all logs where warrantyId IN [...].
    const logsResult = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATION_LOGS,
      [
        Query.equal("warrantyId", warrantyIds),
        Query.limit(1000), // Sanity limit
      ]
    );

    // 2. Collect all Location IDs
    const locationIds = new Set<string>();

    // From warranties
    result.documents.forEach((d) => locationIds.add(d.locationId));

    // From logs
    logsResult.documents.forEach((l) => {
      locationIds.add(l.fromLocationId);
      locationIds.add(l.toLocationId);
    });

    // 3. Fetch Locations
    const locationsResult = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.LOCATIONS,
      [
        Query.equal("$id", Array.from(locationIds)),
        Query.limit(100), // Sanity limit
      ]
    );

    const locMap = new Map(locationsResult.documents.map((l) => [l.$id, l]));

    const data = result.documents.map((doc) =>
      mapToWarranty(doc, locMap, logsResult.documents)
    );

    return {
      data,
      total: result.total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching warranties:", error);
    throw error;
  }
}

export async function saveWarranty(warranty: Warranty): Promise<void> {
  try {
    await databases.createDocument(DB_ID, COLLECTIONS.WARRANTIES, warranty.id, {
      userId: warranty.userId,
      invoiceNumber: warranty.invoiceNumber,
      clientName: warranty.clientName,
      rut: warranty.rut,
      contact: warranty.contact,
      email: warranty.email,
      product: warranty.product,
      failureDescription: warranty.failureDescription,
      sku: warranty.sku,
      locationId: warranty.locationId,
      entryDate: new Date(warranty.entryDate).toISOString(), // ensure ISO format
      deliveryDate: warranty.deliveryDate
        ? new Date(warranty.deliveryDate).toISOString()
        : null,
      readyDate: warranty.readyDate
        ? new Date(warranty.readyDate).toISOString()
        : null,
      status: warranty.status,
      repairCost: warranty.repairCost,
      notes: warranty.notes,
    });
  } catch (error) {
    console.error("Error saving warranty:", error);
    throw error;
  }
}

export async function updateWarranty(
  updatedWarranty: Warranty,
  userId?: string
): Promise<void> {
  // 1. Get current to check ownership and diff
  const current = await databases.getDocument(
    DB_ID,
    COLLECTIONS.WARRANTIES,
    updatedWarranty.id
  );

  if (userId && current.userId !== userId) {
    throw new Error("No warranty found or access denied");
  }

  if (current.status === "completed") {
    throw new Error("Cannot modify a completed warranty");
  }

  // 2. Update Warranty
  await databases.updateDocument(
    DB_ID,
    COLLECTIONS.WARRANTIES,
    updatedWarranty.id,
    {
      invoiceNumber: updatedWarranty.invoiceNumber,
      clientName: updatedWarranty.clientName,
      rut: updatedWarranty.rut,
      contact: updatedWarranty.contact,
      email: updatedWarranty.email,
      product: updatedWarranty.product,
      failureDescription: updatedWarranty.failureDescription,
      sku: updatedWarranty.sku,
      locationId: updatedWarranty.locationId,
      entryDate: new Date(updatedWarranty.entryDate).toISOString(),
      deliveryDate: updatedWarranty.deliveryDate
        ? new Date(updatedWarranty.deliveryDate).toISOString()
        : null,
      readyDate: updatedWarranty.readyDate
        ? new Date(updatedWarranty.readyDate).toISOString()
        : null,
      status: updatedWarranty.status,
      repairCost: updatedWarranty.repairCost,
      notes: updatedWarranty.notes,
    }
  );

  // 3. Create Log if Location changed
  if (current.locationId !== updatedWarranty.locationId) {
    if (
      updatedWarranty.status === "completed" &&
      current.status !== "completed"
    ) {
      // Skip logic as per original
    } else {
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.LOCATION_LOGS,
        ID.unique(),
        {
          userId: current.userId, // use owner ID
          warrantyId: updatedWarranty.id,
          fromLocationId: current.locationId,
          toLocationId: updatedWarranty.locationId,
          changedAt: new Date().toISOString(),
        }
      );
    }
  }
}

export async function deleteWarranty(
  id: string,
  userId?: string
): Promise<void> {
  const current = await databases.getDocument(
    DB_ID,
    COLLECTIONS.WARRANTIES,
    id
  );

  if (userId && current.userId !== userId) {
    throw new Error("No warranty found or access denied");
  }

  await databases.deleteDocument(DB_ID, COLLECTIONS.WARRANTIES, id);
}
