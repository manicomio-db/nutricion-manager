"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertTipCategory } from "../actions";

export function CategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(formData: FormData) {
    await upsertTipCategory(formData);
    formRef.current?.reset();
    toast.success("Categoría guardada.");
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label>Título de la sección</Label>
        <Input name="titulo" placeholder="Ej: Abdomen Plano, Anti-inflamación..." required />
      </div>
      <div className="flex flex-col gap-2 sm:w-28">
        <Label>Orden</Label>
        <Input name="orden" type="number" defaultValue={0} />
      </div>
      <Button type="submit" className="w-fit">
        Crear sección
      </Button>
    </form>
  );
}
