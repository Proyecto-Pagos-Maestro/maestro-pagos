import { CalendarDays, Clock } from "lucide-react";
import type { Datos } from "@/lib/store";
import { formatoFecha, hoyISO, proximoVencimiento, ultimoPago } from "@/lib/store";

export function CalendarioPagos({ datos }: { datos: Datos }) {
  const eventos = datos.estudiantes
    .flatMap((e) => e.pagos.map((fecha) => ({ fecha, nombre: e.nombre })))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const porMes = new Map<string, { fecha: string; nombre: string }[]>();
  for (const ev of eventos) {
    const mes = ev.fecha.slice(0, 7);
    porMes.set(mes, [...(porMes.get(mes) ?? []), ev]);
  }

  const proximos = datos.estudiantes
    .map((e) => ({ nombre: e.nombre, vence: proximoVencimiento(e), ultimo: ultimoPago(e) }))
    .filter((p): p is { nombre: string; vence: string; ultimo: string } => Boolean(p.vence))
    .sort((a, b) => a.vence.localeCompare(b.vence));

  const hoy = hoyISO();
  const etiquetaMes = (mes: string) => {
    const [y, m] = mes.split("-").map(Number);
    return new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" /> Próximos vencimientos
        </h2>
        {proximos.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            Registrá pagos para estimar los próximos vencimientos.
          </p>
        ) : (
          <ul className="space-y-2">
            {proximos.map((p) => {
              const vencido = p.vence < hoy;
              return (
                <li
                  key={p.nombre + p.vence}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-card p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Último pago: {formatoFecha(p.ultimo)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      vencido ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {vencido ? "Vencido " : "Vence "}
                    {formatoFecha(p.vence)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="h-5 w-5" /> Línea de tiempo de pagos
        </h2>
        {porMes.size === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            Todavía no hay pagos registrados.
          </p>
        ) : (
          <div className="space-y-4">
            {[...porMes.entries()].map(([mes, lista]) => (
              <div key={mes} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold capitalize">{etiquetaMes(mes)}</p>
                <ul className="mt-2 space-y-1 border-l-2 border-border pl-4">
                  {lista.map((ev, i) => (
                    <li key={ev.nombre + ev.fecha + i} className="text-sm">
                      <span className="font-medium">{ev.nombre}</span>
                      <span className="text-muted-foreground"> — {formatoFecha(ev.fecha)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}