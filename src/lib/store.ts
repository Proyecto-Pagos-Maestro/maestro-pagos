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

function hace(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function futuro(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function demo(): Datos {
  const g = [
    { id: "g-a1", nombre: "Principiantes A1" },
    { id: "g-b1", nombre: "Intermedios B1" },
    { id: "g-c1", nombre: "Avanzados C1" },
    { id: "g-biz", nombre: "Business English" },
  ];
  const pagoParcial1 = hace(12);
  const pagoParcial2 = hace(18);
  const pagoParcial3 = hace(3);
  const pagoParcial4 = hace(5);
  const proximoPago1 = futuro(8);
  const proximoPago2 = futuro(11);
  const proximoPago3 = futuro(6);
  const proximoPago4 = futuro(4);

  const est: Estudiante[] = [
    // Pagos recientes — tienen vencimiento en el futuro
    { id: "e1", nombre: "María González",  grupoId: "g-a1",  pagos: [hace(95), hace(64), hace(33), hace(3)] },
    { id: "e3", nombre: "Lucía Fernández", grupoId: "g-b1",  pagos: [hace(72), hace(41), hace(11)] },
    { id: "e5", nombre: "Sofía Martínez",  grupoId: "g-c1",  pagos: [hace(60), hace(28), hace(1)] },
    // Pagó hace exactamente 25 días → vence en 5 días (amarillo)
    { id: "e13", nombre: "Renata Vidal",   grupoId: "g-a1",  pagos: [hace(95), hace(64), hace(25)] },
    { id: "e14", nombre: "Emilio Soto",    grupoId: "g-biz", pagos: [hace(90), hace(58), hace(25)] },
    // Pagó hace exactamente 27 días → vence en 3 días (amarillo)
    {
      id: "e15",
      nombre: "Daniela Ríos",
      grupoId: "g-b1",
      pagos: [hace(87), hace(57), pagoParcial3],
      notasPagos: {
        [pagoParcial3]: { parcial: true, deuda: 75, proximoPago: proximoPago3 },
      },
    },
    // Pagó hace exactamente 30 días → vence hoy (amarillo/rojo límite)
    {
      id: "e16",
      nombre: "Gabriel Mora",
      grupoId: "g-c1",
      pagos: [hace(65), hace(35), pagoParcial4],
      notasPagos: {
        [pagoParcial4]: { parcial: true, deuda: 90, proximoPago: proximoPago4 },
      },
    },
    // Pagó hace exactamente 33 días → ya venció hace 3 días (rojo)
    { id: "e17", nombre: "Paola Fuentes",  grupoId: "g-a1",  pagos: [hace(63), hace(33)] },
    { id: "e18", nombre: "Rodrigo Vega",   grupoId: "g-biz", pagos: [hace(68), hace(33)] },
    // Muy atrasados
    { id: "e2",  nombre: "Carlos Ramírez", grupoId: "g-a1",  pagos: [hace(120), hace(88), hace(57)] },
    { id: "e4",  nombre: "Andrés Pérez",   grupoId: "g-b1",  pagos: [hace(210), hace(150), hace(97)] },
    { id: "e6",  nombre: "Diego Torres",   grupoId: "g-c1",  pagos: [hace(140), hace(110), hace(78)] },
    { id: "e7",  nombre: "Valentina Ruiz", grupoId: "g-biz", pagos: [hace(50), hace(19)] },
    { id: "e8",  nombre: "Javier Morales", grupoId: "g-biz", pagos: [hace(180), hace(126)] },
    { id: "e9",  nombre: "Camila Herrera", grupoId: "g-a1",  pagos: [hace(45), hace(14)] },
    { id: "e10", nombre: "Tomás Navarro",  grupoId: "g-b1",  pagos: [hace(240), hace(190)] },
    { id: "e11", nombre: "Isabella Castro",grupoId: "g-c1",  pagos: [hace(36), hace(6)] },
    { id: "e12", nombre: "Mateo Silva",    grupoId: null,     pagos: [] },
    {
      id: "e19",
      nombre: "Anita López",
      grupoId: "g-a1",
      pagos: [pagoParcial1],
      notasPagos: {
        [pagoParcial1]: { parcial: true, deuda: 85, proximoPago: proximoPago1 },
      },
    },
    {
      id: "e20",
      nombre: "Nicolás Peña",
      grupoId: "g-biz",
      pagos: [pagoParcial2],
      notasPagos: {
        [pagoParcial2]: { parcial: true, deuda: 120, proximoPago: proximoPago2 },
      },
    },
  ];
  // Suprimir advertencia del compilador; futuro() se puede usar en datos extendidos
  void futuro;
  return { ...inicial, grupos: g, estudiantes: est };
}

export function useDatos() {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [listo, setListo] = useState(false);
  const datosRef = useRef(datos);

  useEffect(() => {
    datosRef.current = datos;
  }, [datos]);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3001/api/datos`)
      .then((res) => res.json())
      .then((data: Datos) => {
        setDatos({ ...inicial, ...data });
        setListo(true);
      })
      .catch(() => {
        // si el backend no responde, cae a datos demo para no romper la UI
        setDatos(demo());
        setListo(true);
      });
  }, []);

  const actualizar = useCallback((fn: (d: Datos) => Datos) => {
    const next = fn(datosRef.current);
    datosRef.current = next;
    setDatos(next);
    fetch(`http://${window.location.hostname}:3001/api/datos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch((err) => console.error("Error guardando en el servidor:", err));
  }, []);

  return { datos, actualizar, listo };
}