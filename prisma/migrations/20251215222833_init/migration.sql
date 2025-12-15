-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" INTEGER,
    "clientName" TEXT NOT NULL,
    "rut" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "product" TEXT NOT NULL,
    "failureDescription" TEXT,
    "sku" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Ingreso',
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" DATETIME,
    "readyDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "repairCost" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
