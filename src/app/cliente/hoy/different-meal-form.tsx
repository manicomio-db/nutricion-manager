"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveDifferentMeal } from "../hoy-actions";
import type { MealItem } from "@/lib/types";

type Estimate = {
  items: { nombre: string; gramos: number; kcal: number; proteina: number; carbos: number; grasas: number }[];
  total: { kcal: number; proteina: number; carbos: number; grasas: number };
};

export function DifferentMealForm({
  mealIndex,
  placeholder,
  onDone,
}: {
  mealIndex: number | null;
  placeholder: string;
  onDone?: () => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, startSaving] = useTransition();

  async function calcular() {
    if (descripcion.trim().length < 3) {
      toast.error("Describe qué comiste.");
      return;
    }
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await fetch("/api/meals/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo calcular");
      setEstimate(data as Estimate);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo calcular");
    } finally {
      setEstimating(false);
    }
  }

  function guardar() {
    if (!estimate) return;
    const items: MealItem[] = estimate.items.map((i) => ({
      food_id: null,
      food_nombre: i.nombre,
      gramos: i.gramos,
      kcal: i.kcal,
      proteina: i.proteina,
      carbos: i.carbos,
      grasas: i.grasas,
    }));
    startSaving(async () => {
      const res = await saveDifferentMeal({ mealIndex, descripcion, items });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Comida registrada.");
      setDescripcion("");
      setEstimate(null);
      onDone?.();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        value={descripcion}
        onChange={(e) => {
          setDescripcion(e.target.value);
          setEstimate(null);
        }}
        placeholder={placeholder}
        maxLength={400}
      />
      <Button type="button" variant="outline" className="w-fit" onClick={calcular} disabled={estimating}>
        {estimating ? "Calculando..." : "Calcular desglose"}
      </Button>

      {estimate && (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex flex-col gap-1">
            {estimate.items.map((i, idx) => (
              <div key={idx} className="flex justify-between gap-3">
                <span>
                  {i.nombre} <span className="text-muted-foreground">· {i.gramos} g</span>
                </span>
                <span className="shrink-0 text-muted-foreground">{i.kcal} kcal</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 border-t pt-3 text-center">
            <div>
              <p className="text-base font-bold">{estimate.total.kcal}</p>
              <p className="text-[10px] uppercase text-muted-foreground">kcal</p>
            </div>
            <div>
              <p className="text-base font-bold">{estimate.total.proteina} g</p>
              <p className="text-[10px] uppercase text-muted-foreground">Proteína</p>
            </div>
            <div>
              <p className="text-base font-bold">{estimate.total.carbos} g</p>
              <p className="text-[10px] uppercase text-muted-foreground">Carbos</p>
            </div>
            <div>
              <p className="text-base font-bold">{estimate.total.grasas} g</p>
              <p className="text-[10px] uppercase text-muted-foreground">Grasas</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Es un estimado aproximado según lo que describiste.</p>
          <Button type="button" className="w-fit" onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar en mi día"}
          </Button>
        </div>
      )}
    </div>
  );
}
