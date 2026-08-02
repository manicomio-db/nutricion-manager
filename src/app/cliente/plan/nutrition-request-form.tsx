"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestNutritionPlan, type RequestNutritionState } from "../actions";

const initialState: RequestNutritionState = { error: null, success: false };

export function NutritionRequestForm() {
  const [state, formAction, pending] = useActionState(requestNutritionPlan, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("¡Solicitud enviada! Tu nutricionista la revisará pronto.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Input id="objetivo" name="objetivo" placeholder="Ej: Bajar grasa, ganar masa" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="comidas_dia">Comidas al día</Label>
        <Input id="comidas_dia" name="comidas_dia" type="number" min={2} max={8} defaultValue={4} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="restricciones">Restricciones o alergias</Label>
        <Textarea id="restricciones" name="restricciones" placeholder="Lactosa, gluten, ninguna..." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas adicionales</Label>
        <Textarea id="notas" name="notas" placeholder="Horarios, preferencias, etc. (opcional)" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}
