import { useCallback, useEffect, useState } from "react";

export type Grupo = { id: string; nombre: string };
export type Estudiante = {
  id: string;
  nombre: string;
  grupoId: string | null;
  pagos: string[]; // fechas ISO yyyy-mm-dd, ordenadas asc
};
export type Datos = {
  grupos: Grupo[];
  estudiantes: Estudiante[];
  umbral: number;
  pin: string | null;
  usuario: string;
};

const KEY = "pagos-ingles-v1";

export const hoyISO = () => new Date().toISOString().slice(0, 10);

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
  const d = new Date(u);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
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
};

function hace(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function demo(): Datos {
  const g = [
    { id: "g-a1", nombre: "Principiantes A1" },
    { id: "g-b1", nombre: "Intermedios B1" },
    { id: "g-c1", nombre: "Avanzados C1" },
    { id: "g-biz", nombre: "Business English" },
  ];
  const est: Estudiante[] = [
    { id: "e1", nombre: "María González", grupoId: "g-a1", pagos: [hace(95), hace(64), hace(33), hace(3)] },
    { id: "e2", nombre: "Carlos Ramírez", grupoId: "g-a1", pagos: [hace(120), hace(88), hace(57)] },
    { id: "e3", nombre: "Lucía Fernández", grupoId: "g-b1", pagos: [hace(72), hace(41), hace(11)] },
    { id: "e4", nombre: "Andrés Pérez", grupoId: "g-b1", pagos: [hace(210), hace(150), hace(97)] },
    { id: "e5", nombre: "Sofía Martínez", grupoId: "g-c1", pagos: [hace(60), hace(28), hace(1)] },
    { id: "e6", nombre: "Diego Torres", grupoId: "g-c1", pagos: [hace(140), hace(110), hace(78)] },
    { id: "e7", nombre: "Valentina Ruiz", grupoId: "g-biz", pagos: [hace(50), hace(19)] },
    { id: "e8", nombre: "Javier Morales", grupoId: "g-biz", pagos: [hace(180), hace(126)] },
    { id: "e9", nombre: "Camila Herrera", grupoId: "g-a1", pagos: [hace(45), hace(14)] },
    { id: "e10", nombre: "Tomás Navarro", grupoId: "g-b1", pagos: [hace(240), hace(190)] },
    { id: "e11", nombre: "Isabella Castro", grupoId: "g-c1", pagos: [hace(36), hace(6)] },
    { id: "e12", nombre: "Mateo Silva", grupoId: null, pagos: [] },
  ];
  return { ...inicial, grupos: g, estudiantes: est };
}

function leer(): Datos {
  if (typeof window === "undefined") return inicial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return demo();
    return { ...inicial, ...(JSON.parse(raw) as Datos) };
  } catch {
    return demo();
  }
}

export function useDatos() {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setDatos(leer());
    setListo(true);
  }, []);

  const actualizar = useCallback((fn: (d: Datos) => Datos) => {
    setDatos((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible */
      }
      return next;
    });
  }, []);

  return { datos, actualizar, listo };
}