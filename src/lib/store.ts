/**
 * ARCHIVO: src/lib/store.ts
 * -------------------------------------------------------------
 * PROPÓSITO:
 * Es el "Cerebro" de la aplicación en el lado del cliente (Frontend).
 * Contiene todas las definiciones de datos (Interfaces) y la lógica
 * matemática para saber cuántos días faltan para pagar, quién está atrasado, etc.
 * 
 * LÓGICA PRINCIPAL:
 * - Define los "Tipos" (Estudiante, Grupo, Datos) para que TypeScript valide errores.
 * - proximoVencimiento(): Revisa el historial de pagos de un alumno y determina
 *   su "día de ciclo" (ej. si siempre paga los 15) para calcular la próxima fecha de cobro.
 * - useDatos(): Hook de React que se encarga de llamar al backend al iniciar la página
 *   para descargar los datos y mantenerlos sincronizados cada vez que se hace un cambio.
 */
import { useCallback, useEffect, useRef, useState } from "react";
export { activarNotificaciones } from "./push";

export type Grupo = { id: string; nombre: string };

export type NotaPago = {
  parcial: boolean;
  deuda?: number;       // monto pendiente (solo si parcial)
  proximoPago?: string; // fecha ISO manual del próximo pago
};

export type Estudiante = {
  id: string;
  nombre: string;
  grupoId: string | null;
  pagos: string[]; // fechas ISO yyyy-mm-dd, ordenadas asc
  notasPagos?: Record<string, NotaPago>; // key = fecha ISO del pago
  activo?: boolean;             // undefined o true = activo, false = inactivo
  fechaInactivacion?: string;   // fecha ISO en que se archivó
  telefono?: string | undefined;
};
export type Datos = {
  grupos: Grupo[];
  estudiantes: Estudiante[];
  umbral: number;
  pin: string | null;
  usuario: string;
  diasArchivoInactivos: number; // días que se conservan inactivos antes de auto-purga
};

const KEY = "pagos-ingles-v2";

// URL Base de la API (usa la variable de entorno en producción, o localhost en desarrollo)
export const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

export const hoyISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function diasSinPagar(e: Estudiante): number | null {
  const ultimo = ultimoPago(e);
  if (!ultimo) return null;
  const ms = new Date(hoyISO()).getTime() - new Date(ultimo).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function ultimoPago(e: Estudiante): string | null {
  if (!e.pagos.length) return null;
  return [...e.pagos].sort().at(-1) ?? null;
}

export function proximoVencimiento(e: Estudiante): string | null {
  const u = ultimoPago(e);
  if (!u) return null;
  // Si hay una fecha manual de próximo pago, usarla
  const notaManual = e.notasPagos?.[u]?.proximoPago;
  if (notaManual) return notaManual;

  // Determinar el día de pago habitual del estudiante.
  // Si tiene 2+ pagos, usar el día del penúltimo pago para mantener el ciclo.
  // Así, si un alumno paga los 10 y se atrasa al 15, el próximo vencimiento
  // sigue siendo el 10 del mes siguiente (no el 15).
  const pagosOrdenados = [...e.pagos].sort();
  let diaCiclo: number;

  if (pagosOrdenados.length >= 2) {
    // Buscar el día más frecuente entre los pagos anteriores para detectar el patrón
    const dias = pagosOrdenados.map((f) => {
      const partes = f.split("-").map(Number);
      return partes[2]!;
    });
    // Contar frecuencia de cada día
    const freq = new Map<number, number>();
    for (const d of dias) {
      freq.set(d, (freq.get(d) ?? 0) + 1);
    }
    // El día más frecuente es el día de ciclo habitual
    let maxFreq = 0;
    diaCiclo = dias[0]!;
    for (const [dia, count] of freq) {
      if (count > maxFreq) {
        maxFreq = count;
        diaCiclo = dia;
      }
    }
  } else {
    // Solo tiene 1 pago, usar ese día como referencia
    const partes = u.split("-").map(Number);
    diaCiclo = partes[2]!;
  }

  // Calcular el próximo vencimiento: el próximo "diaCiclo" a partir de hoy
  const partesUlt = u.split("-").map(Number);
  const fechaUlt = new Date(partesUlt[0]!, partesUlt[1]! - 1, partesUlt[2]!);
  // Empezar desde el mes del último pago + 1
  let anio = fechaUlt.getFullYear();
  let mes = fechaUlt.getMonth() + 1; // siguiente mes

  // Ajustar si el día de ciclo no existe en el mes (ej: 31 en febrero)
  const ultimoDiaDelMes = new Date(anio, mes + 1, 0).getDate();
  const diaReal = Math.min(diaCiclo, ultimoDiaDelMes);
  const proxima = new Date(anio, mes, diaReal);

  const py = proxima.getFullYear();
  const pm = String(proxima.getMonth() + 1).padStart(2, "0");
  const pd = String(proxima.getDate()).padStart(2, "0");
  return `${py}-${pm}-${pd}`;
}

export function diasHastaVencimiento(e: Estudiante): number | null {
  const venc = proximoVencimiento(e);
  if (!venc) return null;
  const pVenc = venc.split("-").map(Number);
  const pHoy = hoyISO().split("-").map(Number);
  const dVenc = new Date(pVenc[0]!, pVenc[1]! - 1, pVenc[2]!);
  const dHoy = new Date(pHoy[0]!, pHoy[1]! - 1, pHoy[2]!);
  return Math.round((dVenc.getTime() - dHoy.getTime()) / 86400000);
}

export function formatoFecha(iso: string) {
  const p = iso.split("-").map(Number);
  return new Date(p[0] ?? 1970, (p[1] ?? 1) - 1, p[2] ?? 1).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const inicial: Datos = {
  grupos: [],
  estudiantes: [],
  umbral: 30,
  pin: null,
  usuario: "Profesor",
  diasArchivoInactivos: 545, // 1 año y medio por defecto
};



export function useDatos() {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [listo, setListo] = useState(false);
  const datosRef = useRef(datos);

  useEffect(() => {
    datosRef.current = datos;
  }, [datos]);

  useEffect(() => {
    fetch(`${API_URL}/api/datos`)
      .then((res) => res.json())
      .then((data: Datos) => {
        setDatos({ ...inicial, ...data });
        setListo(true);
      })
      .catch((err) => {
        console.error("Error obteniendo datos del backend:", err);
        setListo(true);
      });
  }, []);

  const actualizar = useCallback((fn: (d: Datos) => Datos) => {
    const next = fn(datosRef.current);
    datosRef.current = next;
    setDatos(next);
    fetch(`${API_URL}/api/datos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch((err) => console.error("Error guardando en el servidor:", err));
  }, []);

  return { datos, actualizar, listo };
}