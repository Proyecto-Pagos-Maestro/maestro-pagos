import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Datos } from "@/lib/store";

type Props = {
  datos: Datos;
  onCrear: (nombre: string) => void;
  onRenombrar: (id: string, nombre: string) => void;
  onEliminar: (id: string) => void;
  onAsignar: (estudianteId: string, grupoId: string | null) => void;
};

export function GestionGrupos({ datos, onCrear, onRenombrar, onEliminar, onAsignar }: Props) {
  const [nuevo, setNuevo] = useState("");
  const [agregar, setAgregar] = useState<Record<string, string>>({});
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});

  const sinGrupo = datos.estudiantes.filter((e) => !e.grupoId);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <Input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Nombre del nuevo grupo"
          className="h-11"
        />
        <Button
          size="lg"
          className="h-11"
          onClick={() => {
            if (nuevo.trim()) {
              onCrear(nuevo.trim());
              setNuevo("");
            }
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Crear
        </Button>
      </div>

      {datos.grupos.length === 0 && (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Todavía no hay grupos creados.
        </p>
      )}

      {datos.grupos.map((g) => {
        const miembros = datos.estudiantes.filter((e) => e.grupoId === g.id);
        const disponibles = datos.estudiantes.filter((e) => e.grupoId !== g.id);
        const seleccionadoId = agregar[g.id] ?? "";
        const seleccionadoNombre =
          datos.estudiantes.find((e) => e.id === seleccionadoId)?.nombre ?? "";

        return (
          <div key={g.id} className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-[var(--shadow-soft)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <Input
                value={g.nombre}
                onChange={(e) => onRenombrar(g.id, e.target.value)}
                className="h-11 border-transparent bg-transparent text-base font-semibold text-foreground shadow-none focus-visible:border-input"
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Eliminar grupo ${g.nombre}`}
                onClick={() => {
                  if (confirm(`¿Eliminar el grupo "${g.nombre}"? Los alumnos quedan sin grupo.`))
                    onEliminar(g.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <ul className="mt-3 space-y-1">
              {miembros.length === 0 && (
                <li className="text-sm text-muted-foreground">Sin estudiantes en este grupo.</li>
              )}
              {miembros.map((m) => (
                <li
                  key={m.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-surface/90 px-3 py-2"
                >
                  <span className="truncate text-sm text-foreground">{m.nombre}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAsignar(m.id, null)}
                    aria-label={`Quitar a ${m.nombre} del grupo`}
                  >
                    <UserMinus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Quitar</span>
                  </Button>
                </li>
              ))}
            </ul>

            {disponibles.length > 0 && (
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Popover
                  open={abierto[g.id] ?? false}
                  onOpenChange={(open) =>
                    setAbierto((p) => ({ ...p, [g.id]: open }))
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={abierto[g.id] ?? false}
                      className="h-11 w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {seleccionadoNombre || "Buscar estudiante..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Escribí el nombre..." />
                      <CommandList>
                        <CommandEmpty>No se encontró ningún estudiante.</CommandEmpty>
                        <CommandGroup>
                          {disponibles.map((e) => (
                            <CommandItem
                              key={e.id}
                              value={e.nombre}
                              onSelect={() => {
                                setAgregar((p) => ({
                                  ...p,
                                  [g.id]: e.id === seleccionadoId ? "" : e.id,
                                }));
                                setAbierto((p) => ({ ...p, [g.id]: false }));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  seleccionadoId === e.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {e.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="secondary"
                  className="h-11"
                  onClick={() => {
                    const id = agregar[g.id];
                    if (id) {
                      onAsignar(id, g.id);
                      setAgregar((p) => ({ ...p, [g.id]: "" }));
                    }
                  }}
                >
                  <UserPlus className="mr-1 h-4 w-4" /> Agregar
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {sinGrupo.length > 0 && (
        <p className="text-sm text-foreground">
          Sin grupo: {sinGrupo.map((e) => e.nombre).join(", ")}
        </p>
      )}
    </section>
  );
}