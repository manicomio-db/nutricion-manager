"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logWorkout, type LogWorkoutState } from "@/app/progreso-actions";

const initialState: LogWorkoutState = { error: null, success: false };

export function WorkoutLogForm({
  exercises,
  maxDate,
  clientId,
}: {
  /** Ejercicios del plan vigente, como sugerencias. */
  exercises: string[];
  maxDate: string;
  /** Solo cuando el admin registra a nombre de un cliente. */
  clientId?: string;
}) {
  const [state, formAction, pending] = useActionState(logWorkout, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const listId = `ejercicios-${clientId ?? "propio"}`;

  useEffect(() => {
    if (state.success) {
      toast.success("Registro guardado.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {clientId && <input type="hidden" name="client_id" value={clientId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="exercise">Ejercicio</Label>
          <Input id="exercise" name="exercise" list={listId} placeholder="Ej: Sentadilla" required />
          <datalist id={listId}>
            {exercises.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="log_date">Fecha</Label>
          <Input id="log_date" name="log_date" type="date" max={maxDate} defaultValue={maxDate} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weight_kg">Peso usado (kg)</Label>
          <Input id="weight_kg" name="weight_kg" type="number" step="0.5" min={0} placeholder="Vacío si es peso corporal" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sets">Series</Label>
          <Input id="sets" name="sets" type="number" min={1} max={50} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reps">Repeticiones *</Label>
          <Input id="reps" name="reps" type="number" min={1} max={500} required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Anota tu mejor serie del día en cada ejercicio. Con esto tu entrenador hace el siguiente plan más preciso.
      </p>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : "Guardar registro"}
      </Button>
    </form>
  );
}
