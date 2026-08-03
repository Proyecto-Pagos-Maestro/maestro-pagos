import { AlertTriangle, CalendarClock, TrendingUp, Users } from "lucide-react";
import type { Datos } from "@/lib/store";
import { diasSinPagar } from "@/lib/store";

export function Estadisticas({ datos }: { datos: Datos }) {
  const total = datos.estudiantes.length;
  const dias = datos.estudiantes.map((e) => diasSinPagar(e) ?? 999);
  const atrasados = dias.filter((d) => d > datos.umbral).length;
  const promedio = total ? Math.round(dias.reduce((a, b) => a + b, 0) / total) : 0;
  const peor = [...datos.estudiantes].sort(
    (a, b) => (diasSinPagar(b) ?? 999) - (diasSinPagar(a) ?? 999),
  )[0];

  const items = [
    { icono: Users, etiqueta: "Estudiantes activos", valor: String(total) },
    {
      icono: AlertTriangle,
      etiqueta: `Atrasados (+${datos.umbral} días)`,
      valor: String(atrasados),
      alerta: atrasados > 0,
    },
    { icono: TrendingUp, etiqueta: "Promedio sin pagar", valor: total ? `${promedio} días` : "—" },
    {
      icono: CalendarClock,
      etiqueta: "Mayor atraso",
      valor: peor ? peor.nombre.split(" ")[0] || peor.nombre : "—",
      detalle: peor ? `${diasSinPagar(peor) ?? "sin pagos"} días` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((i) => (
        <div
          key={i.etiqueta}
          className="rounded-xl border bg-card p-4 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <i.icono className={`h-4 w-4 shrink-0 ${i.alerta ? "text-destructive" : ""}`} />
            <span className="truncate text-xs font-medium">{i.etiqueta}</span>
          </div>
          <p
            className={`mt-2 truncate text-2xl font-semibold ${i.alerta ? "text-destructive" : "text-foreground"}`}
          >
            {i.valor}
          </p>
          {i.detalle && <p className="text-xs text-muted-foreground">{i.detalle}</p>}
        </div>
      ))}
    </div>
  );
}