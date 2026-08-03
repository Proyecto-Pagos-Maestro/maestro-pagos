import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Datos, Estudiante } from "@/lib/store";
import { formatoFecha, ultimoPago } from "@/lib/store";

type Props = {
  datos: Datos;
  onGuardar: (id: string | null, nombre: string, grupoId: string | null) => void;
  onEliminar: (id: string) => void;
  onHistorial: (e: Estudiante) => void;
};

export function GestionEstudiantes({ datos, onGuardar, onEliminar, onHistorial }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Estudiante | null>(null);
  const [nombre, setNombre] = useState("");
  const [grupoId, setGrupoId] = useState("sin");

  function abrir(e: Estudiante | null) {
    setEditando(e);
    setNombre(e?.nombre ?? "");
    setGrupoId(e?.grupoId ?? "sin");
    setAbierto(true);
  }

  function guardar() {
    if (!nombre.trim()) return;
    onGuardar(editando?.id ?? null, nombre.trim(), grupoId === "sin" ? null : grupoId);
    setAbierto(false);
  }

  const nombreGrupo = (id: string | null) =>
    datos.grupos.find((g) => g.id === id)?.nombre ?? "Sin grupo";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Estudiantes</h2>
        <Button size="lg" className="h-11" onClick={() => abrir(null)}>
          <Plus className="mr-1 h-4 w-4" /> Nuevo estudiante
        </Button>
      </div>

      {datos.estudiantes.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Todavía no cargaste estudiantes.
        </p>
      ) : (
        <ul className="space-y-2">
          {[...datos.estudiantes]
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map((e) => (
              <li
                key={e.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-card p-4 shadow-[var(--shadow-soft)]"
              >
                <button
                  type="button"
                  onClick={() => onHistorial(e)}
                  className="min-w-0 text-left"
                >
                  <p className="truncate font-semibold">{e.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {nombreGrupo(e.grupoId)} ·{" "}
                    {ultimoPago(e) ? formatoFecha(ultimoPago(e)!) : "Sin pagos registrados"}
                  </p>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${e.nombre}`}
                    onClick={() => abrir(e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${e.nombre}`}
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${e.nombre} y su historial?`)) onEliminar(e.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}

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