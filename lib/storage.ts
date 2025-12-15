import fs from "fs/promises";
import path from "path";
import { Warranty } from "./types";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "warranties.json");

// Helper to ensure directory exists
async function ensureDir() {
  try {
    await fs.access(path.dirname(DATA_FILE_PATH));
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
  }
}

export async function getWarranties(): Promise<Warranty[]> {
  try {
    await ensureDir();
    const data = await fs.readFile(DATA_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or error, return empty array (or default)
    return [];
  }
}

export async function saveWarranty(warranty: Warranty): Promise<void> {
  const warranties = await getWarranties();
  warranties.push(warranty);
  await fs.writeFile(
    DATA_FILE_PATH,
    JSON.stringify(warranties, null, 2),
    "utf-8"
  );
}

export async function updateWarranty(updatedWarranty: Warranty): Promise<void> {
  const warranties = await getWarranties();
  const index = warranties.findIndex((w) => w.id === updatedWarranty.id);
  if (index !== -1) {
    warranties[index] = updatedWarranty;
    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(warranties, null, 2),
      "utf-8"
    );
  }
}

// Delete a warranty
export async function deleteWarranty(id: string): Promise<void> {
  const warranties = await getWarranties();
  const newWarranties = warranties.filter((w) => w.id !== id);
  await fs.writeFile(
    DATA_FILE_PATH,
    JSON.stringify(newWarranties, null, 2),
    "utf-8"
  );
}
