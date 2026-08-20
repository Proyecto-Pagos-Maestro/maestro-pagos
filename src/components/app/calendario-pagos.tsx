import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Datos, Estudiante } from "@/lib/store";
import { diasSinPagar, formatoFecha, hoyISO, proximoVencimiento, ultimoPago } from "@/lib/store";

// ──────────────────────────────────────────────────────
// Tipos internos
// ──────────────────────────────────────────────────────

type EventoDia =
  | {
      estudiante: Estudiante;
      tipo: "pago";
      fecha: string;
      esParcial: boolean;
      deuda?: number;
      proximoPagoNota?: string;
      vencimiento: string | null;
    }
  | {
      estudiante: Estudiante;
      tipo: "vencimiento";
      fecha: string;
    };

type MapaDias = Map<string, EventoDia[]>;

// ──────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────

export function CalendarioPagos({ datos }: { datos: Datos }) {
  const hoy = new Date();
  const hoyStr = hoyISO();

  const [mesActual, setMesActual] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // ── Navegación ───────────────────────────────────────
  const irAnterior = () => {
    setMesActual((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    setDiaSeleccionado(null);
  };
  const irSiguiente = () => {
    setMesActual((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    setDiaSeleccionado(null);
  };

  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const offsetInicio = (primerDiaSemana + 6) % 7; // Lunes = 0

  const nombreMes = mesActual.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  // ── Mapa de eventos por día ─────────────────────────
  const mapaDias = useMemo<MapaDias>(() => {
    const mapa: MapaDias = new Map();

    const push = (fecha: string, ev: EventoDia) => {
      if (!mapa.has(fecha)) mapa.set(fecha, []);
      mapa.get(fecha)!.push(ev);
    };

    for (const est of datos.estudiantes) {
      if (est.activo === false) continue; // excluir inactivos
      // Cada pago registrado
      for (const pago of est.pagos) {
        const nota = est.notasPagos?.[pago];
        const esParcial = Boolean(nota?.parcial);
        const pagosHastaEse = est.pagos.filter((p) => p <= pago);
        const estSimulado: Estudiante = { ...est, pagos: pagosHastaEse };
        const venc = proximoVencimiento(estSimulado);

        push(pago, {
          estudiante: est,
          tipo: "pago",
          fecha: pago,
          esParcial,
          ...(nota?.deuda !== undefined ? { deuda: nota.deuda } : {}),
          ...(nota?.proximoPago !== undefined ? { proximoPagoNota: nota.proximoPago } : {}),
          vencimiento: venc,
        });
      }

      // Vencimiento actual si el estudiante está atrasado
      const vencActual = proximoVencimiento(est);
      if (vencActual !== null) {
        const dAtraso = diasSinPagar(est);
        const atrasado = (dAtraso ?? 9999) > datos.umbral || vencActual < hoyStr;
        if (atrasado) {
          push(vencActual, {
            estudiante: est,
            tipo: "vencimiento",
            fecha: vencActual,
          });
        }
      }
    }

    return mapa;
  }, [datos.estudiantes, hoyStr]);

  // ── Color de punto por evento ───────────────────────
  //   Rojo     → Vencimiento pasado sin pago
  //   Amarillo → Pago parcial registrado ese día
  //   Verde    → Pago completo registrado ese día
  type PuntoColor = "verde" | "amarillo" | "rojo";

  function colorPorEvento(ev: EventoDia): PuntoColor {
    if (ev.tipo === "vencimiento") return "rojo";
    return ev.esParcial ? "amarillo" : "verde";
  }

  function coloresPunto(diaStr: string): PuntoColor[] {
    const evs = mapaDias.get(diaStr);
    if (!evs?.length) return [];
    return evs.map((ev) => colorPorEvento(ev));
  }

  // ── Cuadrícula ────────────────────────────────────────
  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const celdas: (number | null)[] = [
    ...Array(offsetInicio).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  function toDiaStr(dia: number) {
    return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }

  const esHoy = (dia: number) =>
    dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

  const eventosDelDia = diaSeleccionado ? (mapaDias.get(diaSeleccionado) ?? []) : [];

  // ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Calendario ──────────────────────────────────── */}
      <section className="rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
        {/* Encabezado navegación */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <Button variant="ghost" size="icon" onClick={irAnterior} aria-label="Mes anterior" className="h-10 w-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-bold capitalize">{nombreMes}</h2>
          <Button variant="ghost" size="icon" onClick={irSiguiente} aria-label="Mes siguiente" className="h-10 w-10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 pt-3 pb-2">
          {/* Días de semana */}
          <div className="grid grid-cols-7 text-center">
            {diasSemana.map((d) => (
              <span key={d} className="py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {d}
              </span>
            ))}
          </div>

          {/* Días */}
          <div className="grid grid-cols-7">
            {celdas.map((dia, idx) => {
              if (dia === null) return <div key={`e-${idx}`} className="h-12" />;

              const str = toDiaStr(dia);
              const colores = coloresPunto(str);
              const seleccionado = diaSeleccionado === str;
              const hoyDia = esHoy(dia);
              const esClickable = colores.length > 0;

              const puntoCls = (color: PuntoColor) =>
                color === "verde"
                  ? "bg-emerald-500"
                  : color === "amarillo"
                  ? "bg-amber-400"
                  : "bg-destructive";

              return (
                <button
                  key={str}
                  type="button"
                  disabled={!esClickable}
                  onClick={() => setDiaSeleccionado(seleccionado ? null : str)}
                  className={[
                    "flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    esClickable ? "cursor-pointer hover:bg-accent" : "cursor-default",
                    seleccionado ? "bg-accent ring-2 ring-primary" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                      hoyDia ? "bg-primary text-primary-foreground font-bold" : "text-foreground",
                    ].join(" ")}
                  >
                    {dia}
                  </span>
                  <span className="flex items-center gap-1">
                    {colores.map((color, idx) => (
                      <span key={`${str}-${idx}`} className={`h-1.5 w-1.5 rounded-full ${puntoCls(color)}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center justify-end gap-4 border-t px-5 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Pago completo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Pago parcial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            Vencimiento pasado
          </span>
        </div>
      </section>

      {/* ── Panel de detalle del día seleccionado ────────── */}
      {diaSeleccionado && eventosDelDia.length > 0 && (
        <section className="rounded-2xl border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="font-bold text-base">{formatoFecha(diaSeleccionado)}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDiaSeleccionado(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ul className="divide-y">
            {eventosDelDia.map((ev, i) => {
              const ult = ultimoPago(ev.estudiante);

              if (ev.tipo === "vencimiento") {
                return (
                  <li key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-base font-bold text-foreground">{ev.estudiante.nombre}</p>
                      <p className="text-sm font-medium text-destructive">
                        {ult ? `Último pago: ${formatoFecha(ult)}` : "Sin pagos registrados"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive">
                      ⏰ Vencido
                    </span>
                  </li>
                );
              }

              // tipo === "pago"
              if (ev.esParcial) {
                const deudaTexto = ev.deuda !== undefined ? ` · Debe ₡${ev.deuda}` : "";
                const vencTexto = ev.vencimiento ? ` · Próx. vencimiento: ${formatoFecha(ev.vencimiento)}` : "";

                return (
                  <li key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-base font-bold text-foreground">{ev.estudiante.nombre}</p>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        Pago parcial{deudaTexto}{vencTexto}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-300 dark:text-amber-900 border border-amber-400/30">
                      {ev.deuda !== undefined ? `Debe ₡${ev.deuda}` : "Pago Parcial"}
                    </span>
                  </li>
                );
              }

              // Pago completo
              return (
                <li key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-base font-bold text-foreground">{ev.estudiante.nombre}</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Pago completo
                      {ev.vencimiento ? ` · Próx. vencimiento: ${formatoFecha(ev.vencimiento)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Pago Completo
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}