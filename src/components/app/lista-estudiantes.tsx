import { useMemo, useState } from "react";
import { CheckCircle2, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Datos, Estudiante } from "@/lib/store";
import { diasSinPagar, formatoFecha, ultimoPago } from "@/lib/store";

type Props = {
  datos: Datos;
  onPago: (id: string) => void;
  onHistorial: (e: Estudiante) => void;
};

export function ListaEstudiantes({ datos, onPago, onHistorial }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [orden, setOrden] = useState("dias");

  const lista = useMemo(() => {
    return datos.estudiantes
      .filter((e) => e.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
      .filter((e) => grupo === "todos" || (grupo === "sin" ? !e.grupoId : e.grupoId === grupo))
      .sort((a, b) =>
        orden === "alfabetico"
          ? a.nombre.localeCompare(b.nombre, "es")
          : (diasSinPagar(b) ?? 9999) - (diasSinPagar(a) ?? 9999),
      );
  }, [datos.estudiantes, busqueda, grupo, orden]);

  const nombreGrupo = (id: string | null) =>
    datos.grupos.find((g) => g.id === id)?.nombre ?? "Sin grupo";

  return (
    <section className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative min-w-0">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar estudiante..."
            className="h-11 pl-9"
          />
        </div>
        <Select value={grupo} onValueChange={setGrupo}>
          <SelectTrigger className="h-11 sm:w-44">
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los grupos</SelectItem>
            <SelectItem value="sin">Sin grupo</SelectItem>
            {datos.grupos.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={orden} onValueChange={setOrden}>
          <SelectTrigger className="h-11 sm:w-48">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dias">Más días sin pagar</SelectItem>
            <SelectItem value="alfabetico">Orden alfabético</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          No hay estudiantes que coincidan. Agregá alumnos desde la pestaña “Estudiantes”.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((e, i) => {
            const d = diasSinPagar(e);
            const atrasado = (d ?? 9999) > datos.umbral;
            return (
              <li
                key={e.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-card p-3 shadow-[var(--shadow-soft)] sm:p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">
                  {orden === "dias" ? i + 1 : e.nombre.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {nombreGrupo(e.grupoId)} ·{" "}
                    {ultimoPago(e) ? `Último pago: ${formatoFecha(ultimoPago(e)!)}` : "Sin pagos"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1.5 text-right text-sm font-semibold ${
                      atrasado
                        ? "bg-destructive/10 text-destructive"
                        : "bg-success/10 text-[var(--success)]"
                    }`}
                  >
                    {d === null ? "—" : `${d} d`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Ver historial de ${e.nombre}`}
                    onClick={() => onHistorial(e)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-9"
                    aria-label={`Registrar pago de ${e.nombre}`}
                    onClick={() => onPago(e.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Pagó</span>
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