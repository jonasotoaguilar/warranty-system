import { prisma } from "@/lib/prisma";
// Force recompile
import { Warranty, WarrantyStatus } from "./types";
import { formatRut } from "./utils";

// Helper to convert Prisma result to Warranty type (Dates to strings)
function mapToWarranty(item: any): Warranty {
  return {
    ...item,
    location: item.location?.name || "Sin ubicación",
    entryDate: item.entryDate.toISOString(),
    deliveryDate: item.deliveryDate
      ? item.deliveryDate.toISOString()
      : undefined,
    readyDate: item.readyDate ? item.readyDate.toISOString() : undefined,
    status: item.status as WarrantyStatus,
    locationLogs: item.locationLogs?.map((log: any) => ({
      ...log,
      fromLocation: log.fromLocation?.name || "Desconocido",
      toLocation: log.toLocation?.name || "Desconocido",
      changedAt: log.changedAt.toISOString(),
    })),
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
  const skip = (page - 1) * limit;

  // Construir filtros
  const where: any = {};

  if (params?.userId) {
    where.userId = params.userId;
  }

  if (params?.status && params.status.length > 0) {
    where.status = { in: params.status };
  }

  if (params?.location) {
    // Si se pasa un string que parece ID, lo usamos, si no buscamos por nombre
    where.locationId = params.location;
  }

  // Nota: La búsqueda difusa en Prisma SQLite es limitada, pero intentaremos algo básico.
  // Para search real, normalmente se usa un índice FullText o similar.
  if (params?.search) {
    const search = params.search;
    const cleanSearch = search.replaceAll(/[^0-9kK]/g, "").toUpperCase();

    // Generar un conjunto de términos posibles para buscar en el campo RUT
    const rutSearchTerms = new Set<string>();
    rutSearchTerms.add(search); // Original

    if (cleanSearch.length >= 2) {
      rutSearchTerms.add(cleanSearch); // Solo números: 123456789
      const formatted = formatRut(cleanSearch);
      if (formatted) {
        rutSearchTerms.add(formatted); // Con puntos y guion: 12.345.678-9
        // Opcional: Variante solo con guion (común en algunos sistemas)
        const withDash = formatted.replaceAll(".", "");
        if (withDash) rutSearchTerms.add(withDash); // Sin puntos: 12345678-9
      }
    }

    const conditions: any[] = [
      { clientName: { contains: search, mode: "insensitive" } },
      { product: { contains: search, mode: "insensitive" } },
      { invoiceNumber: { contains: search, mode: "insensitive" } },
    ];

    // Agregar todas las variantes de RUT al OR
    rutSearchTerms.forEach((term) => {
      conditions.push({ rut: { contains: term, mode: "insensitive" } });
    });

    where.OR = conditions;
  }

  const [items, total] = await Promise.all([
    prisma.warranty.findMany({
      where,
      skip,
      take: limit,
      orderBy: { entryDate: "desc" },
      include: {
        location: true,
        locationLogs: {
          include: {
            fromLocation: true,
            toLocation: true,
          },
          orderBy: { changedAt: "desc" },
        },
      },
    } as any),
    prisma.warranty.count({ where }),
  ]);

  return {
    data: items.map(mapToWarranty),
    total,
    page,
    limit,
  };
}

export async function saveWarranty(warranty: Warranty): Promise<void> {
  await prisma.warranty.create({
    data: {
      id: warranty.id,
      userId: warranty.userId,
      invoiceNumber: warranty.invoiceNumber as any,
      clientName: warranty.clientName,
      rut: warranty.rut,
      contact: warranty.contact,
      email: warranty.email,
      product: warranty.product,
      failureDescription: warranty.failureDescription,
      sku: warranty.sku,
      locationId: warranty.locationId,
      entryDate: new Date(warranty.entryDate),
      deliveryDate: warranty.deliveryDate
        ? new Date(warranty.deliveryDate)
        : null,
      readyDate: warranty.readyDate ? new Date(warranty.readyDate) : null,
      status: warranty.status,
      repairCost: warranty.repairCost,
      notes: warranty.notes,
    } as any,
  });
}

export async function updateWarranty(
  updatedWarranty: Warranty,
  userId?: string
): Promise<void> {
  const where: any = { id: updatedWarranty.id };
  if (userId) {
    where.userId = userId;
  }

  // 1. Obtener la garantía actual para verificar propiedad y comparar ubicación
  const currentWarranty = await prisma.warranty.findFirst({
    where,
  });

  if (!currentWarranty) {
    throw new Error("No warranty found or access denied");
  }

  // Block modification if completed
  if (currentWarranty.status === "completed") {
    throw new Error("Cannot modify a completed warranty");
  }

  // 2. Preparar operaciones en transacción
  const operations: any[] = [];

  // Actualización de la garantía
  const updateOp = prisma.warranty.update({
    where: { id: updatedWarranty.id },
    data: {
      invoiceNumber: updatedWarranty.invoiceNumber as any,
      clientName: updatedWarranty.clientName,
      rut: updatedWarranty.rut,
      contact: updatedWarranty.contact,
      email: updatedWarranty.email,
      product: updatedWarranty.product,
      failureDescription: updatedWarranty.failureDescription,
      sku: updatedWarranty.sku,
      locationId: updatedWarranty.locationId,
      entryDate: new Date(updatedWarranty.entryDate),
      deliveryDate: updatedWarranty.deliveryDate
        ? new Date(updatedWarranty.deliveryDate)
        : null,
      readyDate: updatedWarranty.readyDate
        ? new Date(updatedWarranty.readyDate)
        : null,
      status: updatedWarranty.status,
      repairCost: updatedWarranty.repairCost,
      notes: updatedWarranty.notes,
    } as any,
  });
  operations.push(updateOp);

  // 3. Verificar cambio de ubicación y crear log
  if (
    (currentWarranty as any).locationId !== (updatedWarranty as any).locationId
  ) {
    const logOp = (prisma as any).locationLog.create({
      data: {
        warrantyId: updatedWarranty.id,
        fromLocationId: (currentWarranty as any).locationId,
        toLocationId: (updatedWarranty as any).locationId,
      },
    });
    operations.push(logOp);
  }

  // 4. Si pasa a completed, ya no generamos log automático.
  if (
    updatedWarranty.status === "completed" &&
    currentWarranty.status !== "completed"
  ) {
    // Ya no se crea log aquí
  }

  // Ejecutar transacción
  await prisma.$transaction(operations);
}

export async function deleteWarranty(
  id: string,
  userId?: string
): Promise<void> {
  const where: any = { id };
  if (userId) {
    where.userId = userId;
  }

  const result = await prisma.warranty.deleteMany({
    where,
  });

  if (result.count === 0) {
    throw new Error("No warranty found or access denied");
  }
}
