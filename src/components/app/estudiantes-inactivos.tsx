import { useMemo, useState } from "react";
import { ArchiveRestore, Search, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Datos, Estudiante } from "@/lib/store";
import { formatoFecha, hoyISO } from "@/lib/store";

type Props = {
  datos: Datos;
  onReactivar: (id: string) => void;
  onEliminarDefinitivo: (id: string) => void;
};

function diasDesde(fechaISO: string): number {
  const hoy = hoyISO().split("-").map(Number);
  const desde = fechaISO.split("-").map(Number);
  const dHoy = new Date(hoy[0]!, hoy[1]! - 1, hoy[2]!);
  const dDesde = new Date(desde[0]!, desde[1]! - 1, desde[2]!);
  return Math.round((dHoy.getTime() - dDesde.getTime()) / 86400000);
}

export function EstudiantesInactivos({ datos, onReactivar, onEliminarDefinitivo }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const inactivos: Estudiante[] = useMemo(
    () =>
      datos.estudiantes
        .filter((e) => e.activo === false)
        .filter((e) =>
          e.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
        )
        .sort((a, b) => {
          // Más recientes primero
          const fa = a.fechaInactivacion ?? "";
          const fb = b.fechaInactivacion ?? "";
          return fb.localeCompare(fa);
        }),
    [datos.estudiantes, busqueda],
  );

  const nombreGrupo = (id: string | null) =>
    datos.grupos.find((g) => g.id === id)?.nombre ?? "Sin grupo";

  function badgeDias(e: Estudiante) {
    if (!e.fechaInactivacion) return null;
    const d = diasDesde(e.fechaInactivacion);
    const max = datos.diasArchivoInactivos;
    const restantes = max - d;

    let cls =
      "rounded-lg px-3 py-1.5 text-xs font-bold ";
    if (restantes <= 7) {
      cls += "bg-destructive/10 text-destructive"; // rojo: por expirar
    } else if (restantes <= 20) {
      cls += "bg-amber-400/20 text-amber-700 dark:text-amber-400"; // amarillo
    } else {
      cls += "bg-secondary text-muted-foreground"; // gris
    }

    return { cls, d, restantes };
  }

  const totalInactivos = datos.estudiantes.filter((e) => e.activo === false).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Estudiantes Inactivos
            {totalInactivos > 0 && (
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-sm font-medium text-muted-foreground">
                {totalInactivos}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se eliminan automáticamente después de {datos.diasArchivoInactivos} días de inactividad.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar inactivo..."
            className="h-11 pl-9"
          />
        </div>
      </div>

      {totalInactivos === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
            <UserX className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sin estudiantes inactivos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando archives un estudiante desde la pestaña Estudiantes, aparecerá aquí.
            </p>
          </div>
        </div>
      ) : inactivos.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          No hay inactivos que coincidan con la búsqueda.
        </p>
      ) : (
        <ul className="space-y-2">
          {inactivos.map((e) => {
            const badge = badgeDias(e);
            const ultimoPagoFecha =
              e.pagos.length > 0
                ? formatoFecha([...e.pagos].sort().at(-1)!)
                : "Sin pagos";

            return (
              <li
                key={e.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl border border-border/70 bg-card/95 p-3.5 shadow-[var(--shadow-soft)] sm:p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-bold text-foreground sm:text-lg">
                      {e.nombre}
                    </p>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Inactivo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {nombreGrupo(e.grupoId)} · Último pago: {ultimoPagoFecha}
                  </p>
                  {e.fechaInactivacion && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Archivado el {formatoFecha(e.fechaInactivacion)}
                      {badge && (
                        <>
                          {" · "}
                          {badge.restantes > 0 ? (
                            <span
                              className={
                                badge.restantes <= 7
                                  ? "text-destructive font-medium"
                                  : badge.restantes <= 20
                                    ? "text-amber-600 dark:text-amber-400 font-medium"
                                    : ""
                              }
                            >
                              Expira en {badge.restantes} días
                            </span>
                          ) : (
                            <span className="text-destructive font-medium">Expirado</span>
                          )}
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {badge && (
                    <span className={badge.cls}>
                      {badge.d}d
                    </span>
                  )}
                  <Button
                    size="default"
                    variant="outline"
                    className="h-10 px-3 text-sm font-semibold text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                    aria-label={`Reactivar a ${e.nombre}`}
                    onClick={() => onReactivar(e.id)}
                  >
                    <ArchiveRestore className="h-4 w-4 mr-1.5" />
                    Reactivar
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 shrink-0"
                    aria-label={`Eliminar definitivamente a ${e.nombre}`}
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar permanentemente a ${e.nombre}? Esta acción no se puede deshacer.`,
                        )
                      ) {
                        onEliminarDefinitivo(e.id);
                      }
                    }}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
