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

function leer(): Datos {
  if (typeof window === "undefined") return inicial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return inicial;
    return { ...inicial, ...(JSON.parse(raw) as Datos) };
  } catch {
    return inicial;
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