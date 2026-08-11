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
import type { Datos, Estudiante, NotaPago } from "@/lib/store";
import { diasHastaVencimiento, diasSinPagar, formatoFecha, ultimoPago, proximoVencimiento } from "@/lib/store";
import { PagoModal } from "@/components/app/pago-modal";

type Props = {
  datos: Datos;
  onPago: (id: string, fecha: string, nota?: NotaPago) => void;
  onHistorial: (e: Estudiante) => void;
};

export function ListaEstudiantes({ datos, onPago, onHistorial }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [orden, setOrden] = useState("dias");
  const [estudiantePago, setEstudiantePago] = useState<Estudiante | null>(null);

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
            const ult = ultimoPago(e);
            const nota = ult ? e.notasPagos?.[ult] : undefined;
            const esParcial = Boolean(nota?.parcial);
            const dSinPagar = diasSinPagar(e);
            const dHastaVenc = diasHastaVencimiento(e);

            const atrasado = (dSinPagar ?? 9999) > datos.umbral || (dHastaVenc !== null && dHastaVenc < 0);
            const esWarning = !atrasado && (esParcial || (dHastaVenc !== null && dHastaVenc <= 5));

            let subTextoCls = "text-emerald-600 dark:text-emerald-400";
            if (atrasado) {
              subTextoCls = "text-destructive font-medium";
            } else if (esParcial) {
              subTextoCls = "text-amber-600 dark:text-amber-400 font-bold";
            } else if (esWarning) {
              subTextoCls = "text-amber-600 dark:text-amber-400 font-medium";
            }

            let badgeCls = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
            if (atrasado) {
              badgeCls = "bg-destructive/10 text-destructive";
            } else if (esWarning || esParcial) {
              badgeCls = "bg-amber-400/20 text-amber-700 dark:bg-amber-300 dark:text-amber-900 border border-amber-400/30";
            }

            const badgeTexto = dHastaVenc !== null
              ? (dHastaVenc < 0 ? `${Math.abs(dHastaVenc)} d` : `${dHastaVenc} d`)
              : (dSinPagar === null ? "—" : `${dSinPagar} d`);

            let detPago = "Sin pagos";
            if (ult) {
              detPago = `Último pago: ${formatoFecha(ult)}`;
              if (esParcial) {
                detPago += ` (Parcial${nota?.deuda !== undefined ? ` · Debe ₡${nota.deuda}` : ""})`;
              }
            }

            return (
              <li
                key={e.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl border border-border/70 bg-card/95 p-3.5 shadow-[var(--shadow-soft)] sm:p-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-base font-bold text-secondary-foreground">
                  {orden === "dias" ? i + 1 : e.nombre.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base sm:text-lg font-bold text-foreground dark:text-foreground">{e.nombre}</p>
                  <p className={`text-xs sm:text-sm ${subTextoCls}`}>
                    {nombreGrupo(e.grupoId)} · {detPago}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-lg px-3 py-1.5 text-center text-sm sm:text-base font-bold ${badgeCls}`}>
                    {badgeTexto}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    aria-label={`Ver historial de ${e.nombre}`}
                    onClick={() => onHistorial(e)}
                  >
                    <History className="h-5 w-5" />
                  </Button>
                  <Button
                    size="default"
                    className="h-10 px-4 text-sm font-semibold"
                    aria-label={`Registrar pago de ${e.nombre}`}
                    onClick={() => setEstudiantePago(e)}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-1.5" />
                    <span>Pagó</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PagoModal
        open={estudiantePago !== null}
        nombreEstudiante={estudiantePago?.nombre ?? ""}
        fechaPredefinida={estudiantePago ? (proximoVencimiento(estudiantePago) ?? undefined) : undefined}
        onClose={() => setEstudiantePago(null)}
        onConfirmar={(fecha, nota) => {
          if (estudiantePago) onPago(estudiantePago.id, fecha, nota);
          setEstudiantePago(null);
        }}
      />
    </section>
  );
}