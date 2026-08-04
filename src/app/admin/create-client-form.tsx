"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientAccount, type CreateClientState } from "./actions";

const initialState: CreateClientState = { error: null };

export function CreateClientForm() {
  const [state, formAction, pending] = useActionState(createClientAccount, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Cuenta de cliente creada.");
      formRef.current?.reset();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <div className="flex flex-col gap-2">
        <Label>Nombre completo</Label>
        <Input name="full_name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Teléfono</Label>
        <Input name="telefono" type="tel" placeholder="Ej: 555 123 4567" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Usuario</Label>
        <Input name="username" placeholder="ej: juanperez" pattern="[a-zA-Z0-9._-]+" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Contraseña temporal</Label>
        <Input name="password" type="password" minLength={6} required />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
