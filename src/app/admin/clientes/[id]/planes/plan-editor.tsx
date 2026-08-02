"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Food, Meal, MealItem } from "@/lib/types";
import { savePlan, updatePlan } from "../../../actions";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function calcItem(food: Food, gramos: number): MealItem {
  const factor = gramos / 100;
  return {
    food_id: food.id,
    food_nombre: food.nombre,
    gramos,
    kcal: round(food.kcal_100g * factor),
    proteina: round(food.proteina_100g * factor),
    carbos: round(food.carbos_100g * factor),
    grasas: round(food.grasas_100g * factor),
  };
}

function mealTotals(meal: Meal) {
  return meal.items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      proteina: acc.proteina + i.proteina,
      carbos: acc.carbos + i.carbos,
      grasas: acc.grasas + i.grasas,
    }),
    { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  );
}

export function PlanEditor({
  clientId,
  planId,
  foods,
  initialTitle,
  initialComidas,
}: {
  clientId: string;
  planId?: string;
  foods: Food[];
  initialTitle: string;
  initialComidas: Meal[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [comidas, setComidas] = useState<Meal[]>(initialComidas);
  const [saving, setSaving] = useState(false);

  function addMeal() {
    setComidas((c) => [...c, { nombre: `Comida ${c.length + 1}`, items: [] }]);
  }

  function removeMeal(i: number) {
    setComidas((c) => c.filter((_, idx) => idx !== i));
  }

  function renameMeal(i: number, nombre: string) {
    setComidas((c) => c.map((m, idx) => (idx === i ? { ...m, nombre } : m)));
  }

  function addItem(mealIdx: number) {
    if (foods.length === 0) {
      toast.error("Agrega alimentos al catálogo primero.");
      return;
    }
    const food = foods[0];
    setComidas((c) =>
      c.map((m, idx) => (idx === mealIdx ? { ...m, items: [...m.items, calcItem(food, 100)] } : m))
    );
  }

  function removeItem(mealIdx: number, itemIdx: number) {
    setComidas((c) =>
      c.map((m, idx) =>
        idx === mealIdx ? { ...m, items: m.items.filter((_, j) => j !== itemIdx) } : m
      )
    );
  }

  function updateItemFood(mealIdx: number, itemIdx: number, foodId: string) {
    const food = foods.find((f) => f.id === foodId);
    if (!food) return;
    setComidas((c) =>
      c.map((m, idx) =>
        idx === mealIdx
          ? {
              ...m,
              items: m.items.map((it, j) => (j === itemIdx ? calcItem(food, it.gramos || 100) : it)),
            }
          : m
      )
    );
  }

  function updateItemGramos(mealIdx: number, itemIdx: number, gramos: number) {
    setComidas((c) =>
      c.map((m, idx) =>
        idx === mealIdx
          ? {
              ...m,
              items: m.items.map((it, j) => {
                if (j !== itemIdx) return it;
                const food = foods.find((f) => f.id === it.food_id);
                return food ? calcItem(food, gramos) : { ...it, gramos };
              }),
            }
          : m
      )
    );
  }

  const dayTotals = comidas.reduce(
    (acc, m) => {
      const t = mealTotals(m);
      return {
        kcal: acc.kcal + t.kcal,
        proteina: acc.proteina + t.proteina,
        carbos: acc.carbos + t.carbos,
        grasas: acc.grasas + t.grasas,
      };
    },
    { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  );

  async function guardar() {
    if (!title.trim() || comidas.length === 0) {
      toast.error("Agrega un título y al menos una comida.");
      return;
    }
    setSaving(true);
    try {
      if (planId) {
        await updatePlan({ id: planId, clientId, title, comidas });
      } else {
        await savePlan({ clientId, title, comidas });
      }
      toast.success("Plan guardado.");
      router.push(`/admin/clientes/${clientId}`);
    } catch {
      toast.error("No se pudo guardar el plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Título del plan</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Totales del día</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <span>
            <strong>{round(dayTotals.kcal)}</strong> kcal
          </span>
          <span>
            <strong>{round(dayTotals.proteina)}g</strong> proteína
          </span>
          <span>
            <strong>{round(dayTotals.carbos)}g</strong> carbos
          </span>
          <span>
            <strong>{round(dayTotals.grasas)}g</strong> grasas
          </span>
        </CardContent>
      </Card>

      {comidas.map((meal, mealIdx) => {
        const totals = mealTotals(meal);
        return (
          <Card key={mealIdx}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Input value={meal.nombre} onChange={(e) => renameMeal(mealIdx, e.target.value)} />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeMeal(mealIdx)}>
                  Quitar comida
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {meal.items.map((item, itemIdx) => (
                <div key={itemIdx} className="grid grid-cols-[2fr_1fr_2fr_auto] items-center gap-2">
                  <Select
                    value={item.food_id ?? undefined}
                    onValueChange={(v) => updateItemFood(mealIdx, itemIdx, String(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {foods.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    value={item.gramos}
                    onChange={(e) => updateItemGramos(mealIdx, itemIdx, Number(e.target.value) || 0)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.kcal} kcal · P {item.proteina}g · C {item.carbos}g · G {item.grasas}g
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(mealIdx, itemIdx)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={() => addItem(mealIdx)} className="w-fit">
                + Alimento
              </Button>
              <p className="text-xs text-muted-foreground">
                Subtotal: {round(totals.kcal)} kcal · P {round(totals.proteina)}g · C {round(totals.carbos)}g · G{" "}
                {round(totals.grasas)}g
              </p>
            </CardContent>
          </Card>
        );
      })}

      <Button type="button" variant="outline" onClick={addMeal} className="w-fit">
        + Comida
      </Button>

      <Button type="button" onClick={guardar} disabled={saving} className="w-fit">
        {saving ? "Guardando..." : "Guardar plan"}
      </Button>
    </div>
  );
}
