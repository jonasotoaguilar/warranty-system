import { prisma } from "@/lib/prisma";
import { Warranty, WarrantyStatus } from "./types";

// Helper to convert Prisma result to Warranty type (Dates to strings)
function mapToWarranty(item: any): Warranty {
  return {
    ...item,
    entryDate: item.entryDate.toISOString(),
    deliveryDate: item.deliveryDate
      ? item.deliveryDate.toISOString()
      : undefined,
    readyDate: item.readyDate ? item.readyDate.toISOString() : undefined,
    status: item.status as WarrantyStatus,
  };
}

export async function getWarranties(): Promise<Warranty[]> {
  const items = await prisma.warranty.findMany({
    orderBy: { entryDate: "desc" },
  });
  return items.map(mapToWarranty);
}

export async function saveWarranty(warranty: Warranty): Promise<void> {
  await prisma.warranty.create({
    data: {
      id: warranty.id,
      invoiceNumber: warranty.invoiceNumber,
      clientName: warranty.clientName,
      rut: warranty.rut,
      contact: warranty.contact,
      email: warranty.email,
      product: warranty.product,
      failureDescription: warranty.failureDescription,
      sku: warranty.sku,
      location: warranty.location,
      entryDate: new Date(warranty.entryDate),
      deliveryDate: warranty.deliveryDate
        ? new Date(warranty.deliveryDate)
        : null,
      readyDate: warranty.readyDate ? new Date(warranty.readyDate) : null,
      status: warranty.status,
      repairCost: warranty.repairCost,
      notes: warranty.notes,
    },
  });
}

export async function updateWarranty(updatedWarranty: Warranty): Promise<void> {
  await prisma.warranty.update({
    where: { id: updatedWarranty.id },
    data: {
      invoiceNumber: updatedWarranty.invoiceNumber,
      clientName: updatedWarranty.clientName,
      rut: updatedWarranty.rut,
      contact: updatedWarranty.contact,
      email: updatedWarranty.email,
      product: updatedWarranty.product,
      failureDescription: updatedWarranty.failureDescription,
      sku: updatedWarranty.sku,
      location: updatedWarranty.location,
      // entryDate usually doesn't change, but we map it anyway
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
    },
  });
}

export async function deleteWarranty(id: string): Promise<void> {
  await prisma.warranty.delete({
    where: { id },
  });
}
