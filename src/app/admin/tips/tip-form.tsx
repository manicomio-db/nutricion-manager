"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TipCategory } from "@/lib/types";
import { upsertTip } from "../actions";

export function TipForm({ categories }: { categories: TipCategory[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(formData: FormData) {
    await upsertTip(formData);
    formRef.current?.reset();
    toast.success("Tip guardado.");
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Primero crea una sección arriba (ej. &quot;ManicomioTips&quot;) para poder agregar tips.
      </p>
    );
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label>Sección</Label>
        <Select name="category_id" required>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Selecciona una sección" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_2fr_100px]">
        <div className="flex flex-col gap-2">
          <Label>Emoji</Label>
          <Input name="emoji" placeholder="🌙" maxLength={4} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Título</Label>
          <Input name="titulo" placeholder="Magnesio por la noche" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Orden</Label>
          <Input name="orden" type="number" defaultValue={0} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Contenido</Label>
        <Textarea
          name="contenido"
          placeholder="Explica el tip: qué es, para qué sirve, cómo tomarlo/hacerlo..."
          required
        />
      </div>
      <Button type="submit" className="w-fit">
        Guardar tip
      </Button>
    </form>
  );
}
