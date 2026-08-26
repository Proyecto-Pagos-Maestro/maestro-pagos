/**
 * ARCHIVO: src/components/app/pago-modal.tsx
 * -------------------------------------------------------------
 * PROPÓSITO:
 * Componente visual que muestra la ventanita emergente para registrar un pago.
 * 
 * LÓGICA PRINCIPAL:
 * - Tiene 2 pasos: Elegir si es completo/parcial, y (si es parcial) agregar detalles.
 * - WhatsApp Automático: Cuando se confirma el pago, si el alumno tiene un 
 *   teléfono registrado (y asumiendo que tiene prefijo o es local), abre 
 *   una pestaña con la API de WhatsApp Web (wa.me) para enviar un recibo al instante.
 */
import { useState } from "react";
import { CheckCircle2, SplitSquareHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NotaPago } from "@/lib/store";
import { hoyISO } from "@/lib/store";

type Props = {
  open: boolean;
  nombreEstudiante: string;
  telefono?: string | undefined;
  fechaPredefinida?: string | undefined;
  onClose: () => void;
  onConfirmar: (fecha: string, nota?: NotaPago) => void;
};

type Paso = "tipo" | "parcial";

export function PagoModal({ nombreEstudiante, telefono, fechaPredefinida, open, onClose, onConfirmar }: Props) {
  const [paso, setPaso] = useState<Paso>("tipo");
  const [deuda, setDeuda] = useState("");
  const [proximoPago, setProximoPago] = useState("");

  const fechaPago = fechaPredefinida || hoyISO();

  function reset() {
    setPaso("tipo");
    setDeuda("");
    setProximoPago("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function enviarWhatsApp() {
    if (!telefono) return;
    
    // Si el número tiene exactamente 8 dígitos, asumimos que es de Costa Rica (506)
    const numLimpio = telefono.replace(/\D/g, ''); // Quita espacios o guiones
    const telefonoFinal = numLimpio.length === 8 ? `506${numLimpio}` : numLimpio;

    const mensaje = `¡Hola ${nombreEstudiante}! Gracias por el pago.`;
    const url = `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  function confirmarCompleto() {
    onConfirmar(fechaPago, { parcial: false });
    enviarWhatsApp();
    reset();
    onClose();
  }

  function confirmarParcial() {
      const nota: NotaPago = {
        parcial: true,
        ...(deuda ? { deuda: Number(deuda) } : {}),
        ...(proximoPago ? { proximoPago } : {}),
      };
    onConfirmar(fechaPago, nota);
    enviarWhatsApp();
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            Registrar pago — {nombreEstudiante}
          </DialogTitle>
        </DialogHeader>

        {/* ── Paso 1: Tipo de pago ─────────────────── */}
        {paso === "tipo" && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              ¿El estudiante pagó completo o fue un pago parcial?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirmarCompleto}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 p-4 text-emerald-700 transition-all hover:bg-emerald-500/20 dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CheckCircle2 className="h-8 w-8" />
                <span className="text-sm font-bold">Completo</span>
                <span className="text-[11px] text-center text-muted-foreground">
                  Pago total recibido
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaso("parcial")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-400/10 p-4 text-amber-700 transition-all hover:bg-amber-400/20 dark:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SplitSquareHorizontal className="h-8 w-8" />
                <span className="text-sm font-bold">Parcial</span>
                <span className="text-[11px] text-center text-muted-foreground">
                  Quedó debiendo algo
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 2: Detalles del pago parcial ────── */}
        {paso === "parcial" && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Anotá los detalles del pago parcial.
            </p>

            <div className="space-y-2">
              <Label htmlFor="deuda">¿Cuánto quedó debiendo? (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₡
                </span>
                <Input
                  id="deuda"
                  type="number"
                  min={0}
                  placeholder="0.00"
                  value={deuda}
                  onChange={(e) => setDeuda(e.target.value)}
                  className="h-11 pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proximo">¿Cuándo será el próximo pago? (opcional)</Label>
              <Input
                id="proximo"
                type="date"
                value={proximoPago}
                onChange={(e) => setProximoPago(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setPaso("tipo")}
              >
                Volver
              </Button>
              <Button className="flex-1 h-11" onClick={confirmarParcial}>
                Guardar pago
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
