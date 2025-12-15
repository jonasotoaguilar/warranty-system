"use client";

import { useEffect, useState } from "react";
import { Warranty, WarrantyStatus } from "@/lib/types";
import { WarrantyTable } from "./WarrantyTable";
import { WarrantyModal } from "./WarrantyModal";
import { WarrantyDetailsModal } from "./WarrantyDetailsModal";
import { Button } from "./ui/button";
import { Plus, LayoutDashboard, Search, Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

export function WarrantyDashboard() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtro de estados
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus[]>([
    "pending",
    "ready",
  ]);

  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [viewingWarranty, setViewingWarranty] = useState<Warranty | null>(null);
  const [locations, setLocations] = useState<string[]>([
    "Recepcion",
    "Taller",
    "Bodega",
    "Proveedor",
    "Cliente",
  ]);

  const fetchWarranties = async () => {
    try {
      const res = await fetch("/api/warranties");
      if (res.ok) {
        const data: Warranty[] = await res.json();
        setWarranties(data);

        // Sincronizar ubicaciones dinámicas si hay nuevas en los datos
        const dataLocs = data.map((w) => w.location);
        setLocations((prev) => {
          const combined = new Set([...prev, ...dataLocs]);
          return Array.from(combined).filter(Boolean);
        });
      }
    } catch (e) {
      console.error("Error fetching warranties", e);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setIsModalOpen(true);
  };

  const handleView = (warranty: Warranty) => {
    setViewingWarranty(warranty);
    setIsDetailsOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingWarranty(null), 300);
  };

  const handleAddLocation = (newLoc: string) => {
    if (!locations.includes(newLoc)) {
      setLocations([...locations, newLoc]);
    }
  };

  const handleDeleteLocation = (locToDelete: string) => {
    // Validar si está en uso
    const isInUse = warranties.some((w) => w.location === locToDelete);
    if (isInUse) {
      alert(
        `No se puede eliminar la ubicación "${locToDelete}" porque hay garantías asignadas a ella.`
      );
      return;
    }

    // Eliminar de la lista local
    setLocations(locations.filter((l) => l !== locToDelete));
  };

  const toggleStatusFilter = (status: WarrantyStatus) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const filteredWarranties = warranties.filter((w) => {
    const term = searchTerm.toLowerCase();
    const invoiceMatch = w.invoiceNumber?.toString().includes(term);
    const nameMatch = w.clientName.toLowerCase().includes(term);
    const matchesSearch = invoiceMatch || nameMatch;

    // Filtro de estado
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(w.status);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Control de Garantías
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Gestiona servicios, estados y ubicaciones.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingWarranty(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Garantía
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder="Buscar por cliente o N° boleta..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Filter className="h-4 w-4" /> Estados:
          </span>
          {(["pending", "ready", "completed"] as WarrantyStatus[]).map(
            (status) => {
              const isActive = statusFilter.includes(status);
              const labels = {
                pending: "Pendientes",
                ready: "Listas",
                completed: "Completadas",
              };
              return (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    isActive
                      ? "bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                      : "bg-transparent text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  }`}
                >
                  {labels[status]}
                </button>
              );
            }
          )}
        </div>
      </div>

      <WarrantyTable
        warranties={filteredWarranties}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={async (warranty) => {
          if (
            confirm(
              `¿Estás seguro de eliminar la garantía #${
                warranty.invoiceNumber || "S/N"
              } de ${warranty.clientName}?`
            )
          ) {
            try {
              const res = await fetch(`/api/warranties?id=${warranty.id}`, {
                method: "DELETE",
              });
              if (res.ok) {
                fetchWarranties();
              } else {
                alert("Error al eliminar");
              }
            } catch (e) {
              console.error(e);
              alert("Error de conexión");
            }
          }
        }}
      />

      <WarrantyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        warrantyToEdit={editingWarranty}
        availableLocations={locations}
        onAddLocation={handleAddLocation}
        onDeleteLocation={handleDeleteLocation}
        onSuccess={() => {
          fetchWarranties();
        }}
      />

      <WarrantyDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        warranty={viewingWarranty}
      />
    </div>
  );
}
