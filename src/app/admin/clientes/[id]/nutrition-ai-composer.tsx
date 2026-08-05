"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Meal, MealItem } from "@/lib/types";
import { saveNutritionPlanFromRequest, markNutritionInProgress, discardNutritionRequest } from "../../actions";

type RequestInfo = {
  id: string;
  clientId: string;
  clientNombre: string;
  objetivo: string;
  restricciones: string | null;
  comidasDia: number | null;
  notas: string | null;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

function round(n: number) {
  return Math.round(n * 10) / 10;
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

function dayTotals(comidas: Meal[]) {
  return comidas.reduce(
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
}

export function NutritionAiComposer({ request }: { request: RequestInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(`Plan nutricional para ${request.clientNombre}`);
  const [source, setSource] = useState<"ia" | "manual">("manual");
  const [comidas, setComidas] = useState<Meal[]>([]);
  const [estimatingKey, setEstimatingKey] = useState<string | null>(null);

  async function generar() {
    setGenerating(true);
    try {
      const res = await fetch("/api/nutrition/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objetivo: request.objetivo,
          restricciones: request.restricciones,
          comidas_dia: request.comidasDia,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error generando plan");
      const generadas: Meal[] = (data.comidas ?? []).map((m: { nombre: string; items: MealItem[] }) => ({
        nombre: m.nombre,
        items: m.items.map((it) => ({ ...it, food_id: null })),
      }));
      setComidas(generadas);
      setSource("ia");
      setExpanded(true);
      toast.success("Plan generado. Revísalo antes de guardar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generando plan");
    } finally {
      setGenerating(false);
    }
  }

  function updateMealNombre(i: number, nombre: string) {
    setComidas((c) => c.map((m, idx) => (idx === i ? { ...m, nombre } : m)));
  }

  function addMeal() {
    setComidas((c) => [...c, { nombre: `Comida ${c.length + 1}`, items: [] }]);
    setExpanded(true);
  }

  function removeMeal(i: number) {
    setComidas((c) => c.filter((_, idx) => idx !== i));
  }

  function addItem(mealIdx: number) {
    setComidas((c) =>
      c.map((m, idx) =>
        idx === mealIdx
          ? { ...m, items: [...m.items, { food_id: null, food_nombre: "", gramos: 100, kcal: 0, proteina: 0, carbos: 0, grasas: 0 }] }
          : m
      )
    );
  }

  function updateItem(mealIdx: number, itemIdx: number, field: keyof MealItem, value: string) {
    setComidas((c) =>
      c.map((m, idx) =>
        idx === mealIdx
          ? {
              ...m,
              items: m.items.map((it, j) =>
                j === itemIdx
                  ? {
                      ...it,
                      [field]: field === "food_nombre" ? value : Number(value) || 0,
                    }
                  : it
              ),
            }
          : m
      )
    );
  }

  function updateGramos(mealIdx: number, itemIdx: number, newGramos: number) {
    setComidas((c) =>
      c.map((m, idx) =>
        idx === mealIdx
          ? {
              ...m,
              items: m.items.map((it, j) => {
                if (j !== itemIdx) return it;
                const oldGramos = it.gramos;
                const factor = oldGramos > 0 ? newGramos / oldGramos : 0;
                return {
                  ...it,
                  gramos: newGramos,
                  kcal: round(it.kcal * factor),
                  proteina: round(it.proteina * factor),
                  carbos: round(it.carbos * factor),
                  grasas: round(it.grasas * factor),
                };
              }),
            }
          : m
      )
    );
  }

  async function estimarItem(mealIdx: number, itemIdx: number) {
    const item = comidas[mealIdx]?.items[itemIdx];
    if (!item || !item.food_nombre.trim()) {
      toast.error("Escribe primero el nombre del alimento.");
      return;
    }
    const key = `${mealIdx}-${itemIdx}`;
    setEstimatingKey(key);
    try {
      const res = await fetch("/api/foods/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: item.food_nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error estimando");
      const gramos = item.gramos || 100;
      const factor = gramos / 100;
      setComidas((c) =>
        c.map((m, idx) =>
          idx === mealIdx
            ? {
                ...m,
                items: m.items.map((it, j) =>
                  j === itemIdx
                    ? {
                        ...it,
                        kcal: round(data.macros.kcal_100g * factor),
                        proteina: round(data.macros.proteina_100g * factor),
                        carbos: round(data.macros.carbos_100g * factor),
                        grasas: round(data.macros.grasas_100g * factor),
                      }
                    : it
                ),
              }
            : m
        )
      );
      toast.success("Macros actualizados.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error estimando el alimento");
    } finally {
      setEstimatingKey(null);
    }
  }

  function removeItem(mealIdx: number, itemIdx: number) {
    setComidas((c) =>
      c.map((m, idx) =>
        idx === mealIdx ? { ...m, items: m.items.filter((_, j) => j !== itemIdx) } : m
      )
    );
  }

  async function guardar() {
    if (!title.trim() || comidas.length === 0) {
      toast.error("Agrega un título y al menos una comida antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      await saveNutritionPlanFromRequest({
        requestId: request.id,
        clientId: request.clientId,
        title,
        comidas,
        source,
      });
      toast.success("Plan asignado al cliente.");
    } catch {
      toast.error("No se pudo guardar el plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {request.clientNombre} — {request.objetivo}
            </CardTitle>
            <CardDescription>
              {request.comidasDia ?? 4} comidas/día
              {request.restricciones ? ` · Restricciones: ${request.restricciones}` : ""}
              {request.notas ? ` · Notas: ${request.notas}` : ""}
            </CardDescription>
          </div>
          <Badge variant="secondary">{STATUS_LABEL[request.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={generar} disabled={generating}>
            {generating ? "Generando..." : "Generar con IA"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Ocultar editor" : "Editar manualmente"}
          </Button>
          {request.status === "pendiente" && (
            <form action={markNutritionInProgress}>
              <input type="hidden" name="request_id" value={request.id} />
              <input type="hidden" name="client_id" value={request.clientId} />
              <Button type="submit" variant="ghost">
                Marcar en progreso
              </Button>
            </form>
          )}
          <form
            action={discardNutritionRequest}
            onSubmit={(e) => {
              if (!confirm(`¿Descartar la solicitud de ${request.clientNombre}? No se puede deshacer.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="request_id" value={request.id} />
            <input type="hidden" name="client_id" value={request.clientId} />
            <Button type="submit" variant="ghost" className="text-destructive">
              Descartar
            </Button>
          </form>
        </div>

        {expanded && (
          <div className="flex flex-col gap-4 rounded-md border p-4">
            <div className="flex flex-col gap-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del plan" />
            </div>

            {comidas.length > 0 && (
              <div className="flex flex-wrap gap-4 rounded-md border bg-muted/30 p-3 text-sm">
                <span>
                  <strong>{round(dayTotals(comidas).kcal)}</strong> kcal
                </span>
                <span>
                  <strong>{round(dayTotals(comidas).proteina)}g</strong> proteína
                </span>
                <span>
                  <strong>{round(dayTotals(comidas).carbos)}g</strong> carbos
                </span>
                <span>
                  <strong>{round(dayTotals(comidas).grasas)}g</strong> grasas
                </span>
              </div>
            )}

            {comidas.map((meal, mealIdx) => {
              const totals = mealTotals(meal);
              return (
                <div key={mealIdx} className="flex flex-col gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Input value={meal.nombre} onChange={(e) => updateMealNombre(mealIdx, e.target.value)} />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeMeal(mealIdx)}>
                      Quitar comida
                    </Button>
                  </div>
                  {meal.items.length > 0 && (
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto_auto] gap-2 px-1 text-xs font-medium text-muted-foreground">
                      <span>Alimento</span>
                      <span>Gramos</span>
                      <span>Calorías</span>
                      <span>Proteína</span>
                      <span>Carbohidratos</span>
                      <span>Grasas</span>
                      <span />
                      <span />
                    </div>
                  )}
                  {meal.items.map((item, itemIdx) => {
                    const key = `${mealIdx}-${itemIdx}`;
                    return (
                      <div key={itemIdx} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto_auto] gap-2">
                        <Input
                          placeholder="Alimento"
                          value={item.food_nombre}
                          onChange={(e) => updateItem(mealIdx, itemIdx, "food_nombre", e.target.value)}
                        />
                        <Input
                          placeholder="Gramos"
                          type="number"
                          value={item.gramos}
                          onChange={(e) => updateGramos(mealIdx, itemIdx, Number(e.target.value) || 0)}
                        />
                        <Input
                          placeholder="Kcal"
                          type="number"
                          value={item.kcal}
                          onChange={(e) => updateItem(mealIdx, itemIdx, "kcal", e.target.value)}
                        />
                        <Input
                          placeholder="Prot"
                          type="number"
                          value={item.proteina}
                          onChange={(e) => updateItem(mealIdx, itemIdx, "proteina", e.target.value)}
                        />
                        <Input
                          placeholder="Carbs"
                          type="number"
                          value={item.carbos}
                          onChange={(e) => updateItem(mealIdx, itemIdx, "carbos", e.target.value)}
                        />
                        <Input
                          placeholder="Grasas"
                          type="number"
                          value={item.grasas}
                          onChange={(e) => updateItem(mealIdx, itemIdx, "grasas", e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          title="Volver a estimar con IA para este alimento y gramaje"
                          disabled={estimatingKey === key}
                          onClick={() => estimarItem(mealIdx, itemIdx)}
                        >
                          {estimatingKey === key ? "..." : "↻"}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(mealIdx, itemIdx)}>
                          ✕
                        </Button>
                      </div>
                    );
                  })}
                  <Button type="button" size="sm" variant="outline" onClick={() => addItem(mealIdx)} className="w-fit">
                    + Alimento
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Subtotal: {round(totals.kcal)} kcal · P {round(totals.proteina)}g · C {round(totals.carbos)}g · G{" "}
                    {round(totals.grasas)}g
                  </p>
                </div>
              );
            })}

            <Button type="button" variant="outline" onClick={addMeal} className="w-fit">
              + Comida
            </Button>

            <Button type="button" onClick={guardar} disabled={saving} className="w-fit">
              {saving ? "Guardando..." : "Guardar y asignar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
