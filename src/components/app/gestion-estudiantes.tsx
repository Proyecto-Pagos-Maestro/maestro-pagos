import { useState } from "react";
import { CheckCircle2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Datos, Estudiante, NotaPago } from "@/lib/store";
import { diasSinPagar, formatoFecha, ultimoPago, proximoVencimiento } from "@/lib/store";
import { PagoModal } from "@/components/app/pago-modal";

type Props = {
  datos: Datos;
  onGuardar: (id: string | null, nombre: string, grupoId: string | null, telefono?: string) => void;
  onEliminar: (id: string) => void;
  onHistorial: (e: Estudiante) => void;
  onPago: (id: string, fecha: string, nota?: NotaPago) => void;
};

export function GestionEstudiantes({ datos, onGuardar, onEliminar, onHistorial, onPago }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Estudiante | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [grupoId, setGrupoId] = useState("sin");
  const [busqueda, setBusqueda] = useState("");
  const [estudiantePago, setEstudiantePago] = useState<Estudiante | null>(null);

  function abrir(e: Estudiante | null) {
    setEditando(e);
    setNombre(e?.nombre ?? "");
    setTelefono(e?.telefono ?? "");
    setGrupoId(e?.grupoId ?? "sin");
    setAbierto(true);
  }

  function guardar() {
    if (!nombre.trim()) return;
    onGuardar(editando?.id ?? null, nombre.trim(), grupoId === "sin" ? null : grupoId, telefono.trim());
    setAbierto(false);
  }

  const nombreGrupo = (id: string | null) =>
    datos.grupos.find((g) => g.id === id)?.nombre ?? "Sin grupo";

  const estudiantesFiltrados = datos.estudiantes
    .filter((e) => e.activo !== false) // excluir inactivos
    .filter((e) => e.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Estudiantes ({datos.estudiantes.length})</h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar estudiante..."
              className="h-11 pl-9"
            />
          </div>
          <Button size="lg" className="h-11 shrink-0" onClick={() => abrir(null)}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo
          </Button>
        </div>
      </div>

      {estudiantesFiltrados.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          {datos.estudiantes.length === 0
            ? "Todavía no cargaste estudiantes."
            : "No se encontraron estudiantes que coincidan con la búsqueda."}
        </p>
      ) : (
        <ul className="space-y-2">
          {estudiantesFiltrados.map((e) => {
            const atrasado = (diasSinPagar(e) ?? 9999) > datos.umbral;
            return (
              <li
                key={e.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl border border-border/70 bg-card/95 p-4 shadow-[var(--shadow-soft)]"
              >
                <button
                  type="button"
                  onClick={() => onHistorial(e)}
                  className="min-w-0 text-left flex-1"
                >
                  <p className="truncate text-base sm:text-lg font-bold text-foreground dark:text-foreground">{e.nombre}</p>
                </button>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="default"
                    className="h-10 px-3 text-sm font-semibold"
                    aria-label={`Registrar pago de ${e.nombre}`}
                    onClick={() => setEstudiantePago(e)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Pagó
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    aria-label={`Editar ${e.nombre}`}
                    onClick={() => abrir(e)}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    aria-label={`Eliminar ${e.nombre}`}
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${e.nombre} y su historial?`)) onEliminar(e.id);
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

      <PagoModal
        open={!!estudiantePago}
        nombreEstudiante={estudiantePago?.nombre ?? ""}
        telefono={estudiantePago?.telefono}
        fechaPredefinida={estudiantePago ? (proximoVencimiento(estudiantePago) ?? undefined) : undefined}
        onClose={() => setEstudiantePago(null)}
        onConfirmar={(fecha, nota) => {
          if (estudiantePago) onPago(estudiantePago.id, fecha, nota);
          setEstudiantePago(null);
        }}
      />

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar estudiante" : "Nuevo estudiante"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-est">Nombre completo</Label>
              <Input
                id="nombre-est"
                value={nombre}
                onChange={(ev) => setNombre(ev.target.value)}
                className="h-11"
                placeholder="Ej. María Fernández"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel-est">Teléfono de WhatsApp (Opcional)</Label>
              <Input
                id="tel-est"
                value={telefono}
                onChange={(ev) => setTelefono(ev.target.value)}
                className="h-11"
                placeholder="Ej. 50688888888"
              />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={grupoId} onValueChange={setGrupoId}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin">Sin grupo</SelectItem>
                  {datos.grupos.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}