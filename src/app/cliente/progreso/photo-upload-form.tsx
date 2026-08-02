"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayLocal } from "@/lib/date";
import { uploadProgressPhoto, type UploadPhotoState } from "../actions";

const initialState: UploadPhotoState = { error: null, success: false };

export function PhotoUploadForm() {
  const [state, formAction, pending] = useActionState(uploadProgressPhoto, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Foto subida.");
      formRef.current?.reset();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="foto">Foto</Label>
        <Input id="foto" name="foto" type="file" accept="image/*" capture="environment" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fecha">Fecha</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={todayLocal()} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" placeholder="Ej: frente, lado, después de entrenar... (opcional)" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Subiendo..." : "Subir foto"}
      </Button>
    </form>
  );
}
