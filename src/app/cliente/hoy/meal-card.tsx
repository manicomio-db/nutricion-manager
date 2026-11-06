"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MealItem, MealLog, MealMomento } from "@/lib/types";
import { deleteMealLog, toggleMeal } from "../hoy-actions";
import { DifferentMealForm } from "./different-meal-form";

type Totals = { kcal: number; proteina: number; carbos: number; grasas: number };

function r(n: number) {
  return Math.round(n * 10) / 10;
}

export function MealCard({
  mealIndex,
  nombre,
  momento,
  items,
  totals,
  log,
}: {
  mealIndex: number;
  nombre: string;
  momento: MealMomento | undefined;
  items: MealItem[];
  totals: Totals;
  log: MealLog | null;
}) {
  const [pending, startTransition] = useTransition();
  const [showOther, setShowOther] = useState(false);

  function run(fn: () => Promise<{ error: string | null }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
    });
  }

  const cumplida = log?.kind === "plan";
  const otra = log?.kind === "otra";

  return (
    <Card className={cumplida ? "border-primary/50" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {cumplida && <Check className="size-5 text-primary" />}
          {nombre}
          {momento === "pre" && <Badge>Pre-entreno</Badge>}
          {momento === "post" && <Badge>Post-entreno</Badge>}
        </CardTitle>
        <CardDescription>
          {r(totals.kcal)} kcal · P {r(totals.proteina)}g · C {r(totals.carbos)}g · G {r(totals.grasas)}g
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Ver alimentos del plan</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {items.map((item, j) => (
              <li key={j} className="flex justify-between">
                <span>
                  {item.food_nombre} — {item.gramos}g
                </span>
                <span className="text-muted-foreground">{item.kcal} kcal</span>
              </li>
            ))}
          </ul>
        </details>

        {cumplida && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-primary">Cumplida ✓</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => toggleMeal(mealIndex, false))}
            >
              Desmarcar
            </Button>
          </div>
        )}

        {otra && log && (
          <div className="flex flex-col gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
            <p className="font-medium">Comiste otra cosa en esta comida</p>
            <p className="text-muted-foreground">{log.descripcion}</p>
            <p>
              {r(Number(log.kcal))} kcal · P {r(Number(log.proteina))}g · C {r(Number(log.carbos))}g · G{" "}
              {r(Number(log.grasas))}g
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="w-fit"
              disabled={pending}
              onClick={() => run(() => deleteMealLog(log.id))}
            >
              Deshacer
            </Button>
          </div>
        )}

        {!log && (
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending} onClick={() => run(() => toggleMeal(mealIndex, true))}>
              ✓ La cumplí
            </Button>
            <Button variant="outline" onClick={() => setShowOther((s) => !s)}>
              {showOther ? "Cancelar" : "Comí otra cosa"}
            </Button>
          </div>
        )}

        {!log && showOther && (
          <DifferentMealForm
            mealIndex={mealIndex}
            placeholder="Ej: 3 tacos de pastor con piña y un refresco de cola"
            onDone={() => setShowOther(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
