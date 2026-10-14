"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetClientPassword, type ResetPasswordState } from "../../actions";

const initialState: ResetPasswordState = { error: null, success: false };

// Sin caracteres ambiguos (0/O, 1/l/I) para que sea fácil de dictar por WhatsApp.
const CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(length = 8) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

export function ResetPasswordForm({ clientId, username }: { clientId: string; username: string | null }) {
  const [state, formAction, pending] = useActionState(resetClientPassword, initialState);
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const lastPassword = useRef("");

  useEffect(() => {
    if (state.success) {
      toast.success("Contraseña actualizada.");
      setSavedPassword(lastPassword.current);
      setPassword("");
    }
  }, [state]);

  return (
    <form
      action={(formData) => {
        lastPassword.current = String(formData.get("password") ?? "");
        setSavedPassword(null);
        formAction(formData);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="client_id" value={clientId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="new_password">Nueva contraseña</Label>
        <div className="flex gap-2">
          <Input
            id="new_password"
            name="password"
            type="text"
            autoComplete="off"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>
            Generar
          </Button>
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {savedPassword && (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
          Listo. Compártele al socio estos datos para entrar:
          <p className="mt-1">
            Usuario: <strong>{username ?? "—"}</strong> · Contraseña: <strong>{savedPassword}</strong>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Esta contraseña solo se muestra ahora; no se puede volver a consultar.
          </p>
        </div>
      )}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
