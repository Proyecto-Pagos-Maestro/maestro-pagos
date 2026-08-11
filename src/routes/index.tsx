import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Moon, Settings2, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PinGate } from "@/components/app/pin-gate";
import { Estadisticas } from "@/components/app/estadisticas";
import { ListaEstudiantes } from "@/components/app/lista-estudiantes";
import { GestionEstudiantes } from "@/components/app/gestion-estudiantes";
import { GestionGrupos } from "@/components/app/gestion-grupos";
import { CalendarioPagos } from "@/components/app/calendario-pagos";
import { PagoModal } from "@/components/app/pago-modal";
import type { Estudiante, NotaPago } from "@/lib/store";
import { formatoFecha, hoyISO, uid, useDatos } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Control de Pagos | Clases de Inglés" },
      {
        name: "description",
        content:
          "Ranking de alumnos por días sin pagar, grupos, historial de pagos y próximos vencimientos en una sola pantalla.",
      },
      { property: "og:title", content: "Control de Pagos | Clases de Inglés" },
      {
        property: "og:description",
        content: "Seguimiento simple y elegante de los pagos de tus alumnos de inglés.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { datos, actualizar, listo } = useDatos();
  const [entro, setEntro] = useState(false);
  const [historial, setHistorial] = useState<Estudiante | null>(null);
  const [ajustes, setAjustes] = useState(false);
  const [pagoManual, setPagoManual] = useState(hoyISO());
  const [abrirPagoHistorial, setAbrirPagoHistorial] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(false);

  useEffect(() => {
    const temaGuardado = window.localStorage.getItem("pagos-ingles-theme");
    const esOscuro = temaGuardado ? temaGuardado === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setModoOscuro(esOscuro);
    document.documentElement.classList.toggle("dark", esOscuro);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", modoOscuro);
    window.localStorage.setItem("pagos-ingles-theme", modoOscuro ? "dark" : "light");
  }, [modoOscuro]);

  if (!listo) return <div className="min-h-screen bg-background" />;

  if (!entro) {
    return (
      <PinGate
        usuario={datos.usuario}
        pin={datos.pin}
        onConfigurar={(usuario, pin) => {
          actualizar((d) => ({ ...d, usuario, pin }));
          setEntro(true);
        }}
        onEntrar={() => setEntro(true)}
      />
    );
  }

  const registrarPago = (id: string, fecha = hoyISO(), nota?: NotaPago) =>
    actualizar((d) => ({
      ...d,
      estudiantes: d.estudiantes.map((e) => {
        if (e.id !== id) return e;
        const nuevoPagos = e.pagos.includes(fecha)
          ? e.pagos
          : [...e.pagos, fecha].sort();
        const nuevasNotas = { ...(e.notasPagos ?? {}) };
        if (nota) {
          nuevasNotas[fecha] = nota;
        } else {
          delete nuevasNotas[fecha];
        }
        return { ...e, pagos: nuevoPagos, notasPagos: nuevasNotas };
      }),
    }));

  const detalle = historial
    ? (datos.estudiantes.find((e) => e.id === historial.id) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/educare-logo.png"
              alt="Educare Logo"
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">Control de Pagos</h1>
              <p className="truncate text-xs text-muted-foreground">Hola, {datos.usuario}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={modoOscuro ? "Activar modo claro" : "Activar modo oscuro"}
              onClick={() => setModoOscuro((prev) => !prev)}
            >
              {modoOscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Ajustes" onClick={() => setAjustes(true)}>
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Salir" onClick={() => setEntro(false)}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <Estadisticas
          datos={datos}
          onPago={(id) => registrarPago(id)}
          onHistorial={setHistorial}
        />

        <Tabs defaultValue="panel" className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
            <TabsTrigger value="panel" className="h-10">
              Panel
            </TabsTrigger>
            <TabsTrigger value="estudiantes" className="h-10">
              Estudiantes
            </TabsTrigger>
            <TabsTrigger value="grupos" className="h-10">
              Grupos
            </TabsTrigger>
            <TabsTrigger value="calendario" className="h-10">
              Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panel">
            <ListaEstudiantes
              datos={datos}
              onPago={(id, fecha, nota) => registrarPago(id, fecha, nota)}
              onHistorial={setHistorial}
            />
          </TabsContent>

          <TabsContent value="estudiantes">
            <GestionEstudiantes
              datos={datos}
              onHistorial={setHistorial}
              onPago={(id, fecha, nota) => registrarPago(id, fecha, nota)}
              onGuardar={(id, nombre, grupoId) =>
                actualizar((d) =>
                  id
                    ? {
                        ...d,
                        estudiantes: d.estudiantes.map((e) =>
                          e.id === id ? { ...e, nombre, grupoId } : e,
                        ),
                      }
                    : {
                        ...d,
                        estudiantes: [
                          ...d.estudiantes,
                          { id: uid(), nombre, grupoId, pagos: [] },
                        ],
                      },
                )
              }
              onEliminar={(id) =>
                actualizar((d) => ({
                  ...d,
                  estudiantes: d.estudiantes.filter((e) => e.id !== id),
                }))
              }
            />
          </TabsContent>

          <TabsContent value="grupos">
            <GestionGrupos
              datos={datos}
              onCrear={(nombre) =>
                actualizar((d) => ({ ...d, grupos: [...d.grupos, { id: uid(), nombre }] }))
              }
              onRenombrar={(id, nombre) =>
                actualizar((d) => ({
                  ...d,
                  grupos: d.grupos.map((g) => (g.id === id ? { ...g, nombre } : g)),
                }))
              }
              onEliminar={(id) =>
                actualizar((d) => ({
                  ...d,
                  grupos: d.grupos.filter((g) => g.id !== id),
                  estudiantes: d.estudiantes.map((e) =>
                    e.grupoId === id ? { ...e, grupoId: null } : e,
                  ),
                }))
              }
              onAsignar={(estudianteId, grupoId) =>
                actualizar((d) => ({
                  ...d,
                  estudiantes: d.estudiantes.map((e) =>
                    e.id === estudianteId ? { ...e, grupoId } : e,
                  ),
                }))
              }
            />
          </TabsContent>

          <TabsContent value="calendario">
            <CalendarioPagos datos={datos} />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={Boolean(detalle)} onOpenChange={(o) => !o && setHistorial(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de {detalle?.nombre}</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-4">
              {detalle.pagos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
              ) : (
                <ul className="max-h-60 space-y-2 overflow-y-auto">
                  {[...detalle.pagos].reverse().map((f) => {
                    const nota = detalle.notasPagos?.[f];
                    return (
                      <li
                        key={f}
                        className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{formatoFecha(f)}</p>
                          {nota?.parcial && (
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              Pago parcial
                              {nota.deuda !== undefined ? ` (Debe ₡${nota.deuda})` : ""}
                              {nota.proximoPago ? ` · Próx. pago: ${formatoFecha(nota.proximoPago)}` : ""}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            actualizar((d) => ({
                              ...d,
                              estudiantes: d.estudiantes.map((e) => {
                                if (e.id !== detalle.id) return e;
                                const nuevasNotas = { ...(e.notasPagos ?? {}) };
                                delete nuevasNotas[f];
                                return {
                                  ...e,
                                  pagos: e.pagos.filter((p) => p !== f),
                                  notasPagos: nuevasNotas,
                                };
                              }),
                            }))
                          }
                        >
                          Quitar
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  type="date"
                  value={pagoManual}
                  onChange={(e) => setPagoManual(e.target.value)}
                  className="h-11"
                />
                <Button
                  className="h-11"
                  onClick={() => pagoManual && setAbrirPagoHistorial(true)}
                >
                  Agregar pago
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {detalle && (
        <PagoModal
          open={abrirPagoHistorial}
          nombreEstudiante={detalle.nombre}
          fechaPredefinida={pagoManual}
          onClose={() => setAbrirPagoHistorial(false)}
          onConfirmar={(fecha, nota) => {
            registrarPago(detalle.id, fecha, nota);
            setAbrirPagoHistorial(false);
          }}
        />
      )}

      <Dialog open={ajustes} onOpenChange={setAjustes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="umbral">Días para considerar atrasado</Label>
            <Input
              id="umbral"
              type="number"
              min={1}
              value={datos.umbral}
              onChange={(e) =>
                actualizar((d) => ({ ...d, umbral: Math.max(1, Number(e.target.value) || 1) }))
              }
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Sugerido: 30 días (ciclo mensual).</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setAjustes(false)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
