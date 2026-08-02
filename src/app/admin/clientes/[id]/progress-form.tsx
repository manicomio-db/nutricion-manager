"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayLocal } from "@/lib/date";
import { addProgressLog } from "../../actions";

export function ProgressLogForm({ clientId }: { clientId: string }) {
  async function onSubmit(formData: FormData) {
    await addProgressLog(formData);
    toast.success("Medición registrada.");
  }

  const today = todayLocal();

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>Fecha</Label>
          <Input name="fecha" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Peso (kg)</Label>
          <Input name="peso_kg" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>% Grasa</Label>
          <Input name="grasa_pct" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Cintura (cm)</Label>
          <Input name="cintura" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Cadera (cm)</Label>
          <Input name="cadera" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Brazo (cm)</Label>
          <Input name="brazo" type="number" step="0.1" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Pecho (cm)</Label>
          <Input name="pecho" type="number" step="0.1" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border p-3">
        <p className="text-sm font-medium">Composición corporal (InBody)</p>
        <p className="text-xs text-muted-foreground">Opcional — solo si tienes báscula de bioimpedancia.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>Masa muscular (kg)</Label>
            <Input name="masa_muscular_kg" type="number" step="0.1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Masa grasa (kg)</Label>
            <Input name="masa_grasa_kg" type="number" step="0.1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Grasa visceral</Label>
            <Input name="grasa_visceral" type="number" step="0.1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Agua corporal (L)</Label>
            <Input name="agua_corporal_l" type="number" step="0.1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tasa metabólica basal (kcal)</Label>
            <Input name="tasa_metabolica_kcal" type="number" step="1" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Notas</Label>
        <Textarea name="notas" />
      </div>
      <Button type="submit" className="w-fit">
        Registrar
      </Button>
    </form>
  );
}
