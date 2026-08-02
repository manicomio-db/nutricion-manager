"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/types";
import { updateClientProfile } from "../../actions";

export function ClientProfileForm({ client }: { client: Profile }) {
  async function onSubmit(formData: FormData) {
    await updateClientProfile(formData);
    toast.success("Datos actualizados.");
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={client.id} />
      <div className="flex flex-col gap-2">
        <Label>Nombre completo</Label>
        <Input name="full_name" defaultValue={client.full_name ?? ""} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Objetivo</Label>
        <Input name="objetivo" defaultValue={client.objetivo ?? ""} placeholder="Ej: Bajar grasa, ganar masa" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Altura (cm)</Label>
        <Input name="altura_cm" type="number" defaultValue={client.altura_cm ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Restricciones / alergias</Label>
        <Textarea name="restricciones" defaultValue={client.restricciones ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Notas</Label>
        <Textarea name="notas" defaultValue={client.notas ?? ""} />
      </div>
      <Button type="submit" className="w-fit">
        Guardar
      </Button>
    </form>
  );
}
