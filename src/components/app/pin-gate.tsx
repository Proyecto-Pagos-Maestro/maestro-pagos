import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  usuario: string;
  pin: string | null;
  onConfigurar: (usuario: string, pin: string) => void;
  onEntrar: () => void;
};

export function PinGate({ usuario, pin, onConfigurar, onEntrar }: Props) {
  const [nombre, setNombre] = useState(usuario);
  const [valor, setValor] = useState("");
  const [error, setError] = useState("");

  const configurado = Boolean(pin);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(valor)) {
      setError("El PIN debe tener 4 dígitos.");
      return;
    }
    if (!configurado) {
      onConfigurar(nombre.trim() || "Profesor", valor);
      return;
    }
    if (valor !== pin) {
      setError("PIN incorrecto. Intentá de nuevo.");
      setValor("");
      return;
    }
    onEntrar();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/educare-logo.png"
            alt="Educare Logo"
            className="mb-4 h-16 w-16 rounded-2xl object-cover shadow-sm"
          />
          <h1 className="text-2xl font-semibold">Control de Pagos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {configurado
              ? `Hola ${usuario}, ingresá tu PIN para continuar.`
              : "Configurá tu acceso: tu nombre y un PIN de 4 dígitos."}
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          {!configurado && (
            <div className="space-y-2">
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Profesor"
                className="h-12 text-base"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="pin">PIN de 4 dígitos</Label>
            <Input
              id="pin"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={valor}
              onChange={(e) => {
                setValor(e.target.value.replace(/\D/g, "").slice(0, 4));
                setError("");
              }}
              placeholder="••••"
              className="h-14 text-center text-2xl tracking-[0.6em]"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="h-12 w-full text-base">
            {configurado ? "Entrar" : "Crear acceso"}
          </Button>
        </form>
      </div>
    </main>
  );
}