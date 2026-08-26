import { useState } from "react";
import { AlertTriangle, TrendingUp, Users, History, CheckCircle2 } from "lucide-react";
import type { Datos, Estudiante, NotaPago } from "@/lib/store";
import { diasSinPagar, formatoFecha, ultimoPago, proximoVencimiento } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PagoModal } from "@/components/app/pago-modal";

type Props = {
  datos: Datos;
  onPago?: (id: string, fecha: string, nota?: NotaPago) => void;
  onHistorial?: (e: Estudiante) => void;
};

export function Estadisticas({ datos, onPago, onHistorial }: Props) {
  const [verAtrasados, setVerAtrasados] = useState(false);
  const [estudiantePago, setEstudiantePago] = useState<Estudiante | null>(null);

  const total = datos.estudiantes.filter((e) => e.activo !== false).length;
  const estudiantesAtrasados = datos.estudiantes
    .filter((e) => e.activo !== false)
    .filter((e) => (diasSinPagar(e) ?? 999) > datos.umbral)
    .sort((a, b) => (diasSinPagar(b) ?? 999) - (diasSinPagar(a) ?? 999));

  const atrasados = estudiantesAtrasados.length;
  const porcentajeSinPagar = total ? Math.round((atrasados / total) * 100) : 0;

  const nombreGrupo = (id: string | null) =>
    datos.grupos.find((g) => g.id === id)?.nombre ?? "Sin grupo";

  const items = [
    {
      icono: Users,
      etiqueta: "Estudiantes activos",
      valor: String(total),
      onClick: undefined,
    },
    {
      icono: AlertTriangle,
      etiqueta: `Atrasados (+${datos.umbral} días)`,
      valor: String(atrasados),
      alerta: atrasados > 0,
      onClick: () => setVerAtrasados(true),
      subtexto: "Haz clic para ver lista",
    },
    {
      icono: TrendingUp,
      etiqueta: "Promedio estudiantes sin pagar",
      valor: total ? `${porcentajeSinPagar}%` : "0%",
      onClick: undefined,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {items.map((i) => {
          const isClickable = Boolean(i.onClick);
          return (
            <div
              key={i.etiqueta}
              onClick={i.onClick}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  i.onClick?.();
                }
              }}
              className={`rounded-xl border bg-card p-4 shadow-[var(--shadow-soft)] transition-all ${isClickable
                ? "cursor-pointer hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : ""
                }`}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <i.icono className={`h-4 w-4 shrink-0 ${i.alerta ? "text-destructive" : ""}`} />
                  <span className="truncate text-xs font-medium">{i.etiqueta}</span>
                </div>
              </div>
              <p
                className={`mt-2 truncate text-2xl font-semibold ${i.alerta ? "text-destructive" : "text-foreground"
                  }`}
              >
                {i.valor}
              </p>
              {i.subtexto && (
                <p className="mt-1 text-[11px] font-medium text-destructive underline decoration-dotted">
                  {i.subtexto}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={verAtrasados} onOpenChange={setVerAtrasados}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Estudiantes Atrasados ({estudiantesAtrasados.length})
            </DialogTitle>
          </DialogHeader>

          {estudiantesAtrasados.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              ¡Genial! No hay estudiantes con más de {datos.umbral} días de atraso.
            </p>
          ) : (
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {estudiantesAtrasados.map((e) => {
                const d = diasSinPagar(e);
                return (
                  <li
                    key={e.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl border bg-card p-3.5 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base sm:text-lg font-bold">{e.nombre}</p>
                      <p className="text-xs sm:text-sm font-medium text-destructive">
                        {nombreGrupo(e.grupoId)} ·{" "}
                        {ultimoPago(e)
                          ? `Último pago: ${formatoFecha(ultimoPago(e)!)}`
                          : "Sin pagos registrados"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-lg bg-destructive/10 px-3 py-1.5 text-sm sm:text-base font-bold text-destructive">
                        {d === null ? "Sin pagos" : `${d} d`}
                      </span>
                      {onHistorial && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          aria-label={`Ver historial de ${e.nombre}`}
                          onClick={() => {
                            setVerAtrasados(false);
                            onHistorial(e);
                          }}
                        >
                          <History className="h-5 w-5" />
                        </Button>
                      )}
                      {onPago && (
                        <Button
                          size="default"
                          className="h-10 px-4 text-sm font-semibold"
                          aria-label={`Registrar pago de ${e.nombre}`}
                          onClick={() => {
                            setEstudiantePago(e);
                          }}
                        >
                          <CheckCircle2 className="mr-1.5 h-5 w-5" />
                          Pagó
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <PagoModal
        open={!!estudiantePago}
        nombreEstudiante={estudiantePago?.nombre ?? ""}
        telefono={estudiantePago?.telefono}
        fechaPredefinida={estudiantePago ? (proximoVencimiento(estudiantePago) ?? undefined) : undefined}
        onClose={() => setEstudiantePago(null)}
        onConfirmar={(fecha, nota) => {
          if (estudiantePago && onPago) onPago(estudiantePago.id, fecha, nota);
          setEstudiantePago(null);
        }}
      />
    </>
  );
}