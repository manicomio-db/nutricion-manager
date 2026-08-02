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
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label>Nombre completo</Label>
        <Input name="full_name" required />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label>Correo</Label>
        <Input name="email" type="email" required />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label>Contraseña temporal</Label>
        <Input name="password" type="password" minLength={6} required />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
