import type { Meal, MealLog, NutritionPlan } from "@/lib/types";

export type Totals = { kcal: number; proteina: number; carbos: number; grasas: number };

export const ZERO: Totals = { kcal: 0, proteina: 0, carbos: 0, grasas: 0 };

export function addTotals(a: Totals, b: Totals): Totals {
  return {
    kcal: a.kcal + b.kcal,
    proteina: a.proteina + b.proteina,
    carbos: a.carbos + b.carbos,
    grasas: a.grasas + b.grasas,
  };
}

export function mealTotals(meal: Meal): Totals {
  return meal.items.reduce(
    (acc, i) =>
      addTotals(acc, { kcal: i.kcal, proteina: i.proteina, carbos: i.carbos, grasas: i.grasas }),
    ZERO
  );
}

export function planTotals(plan: NutritionPlan | null): Totals {
  if (!plan) return ZERO;
  return plan.comidas.reduce((acc, m) => addTotals(acc, mealTotals(m)), ZERO);
}

export function logTotals(logs: MealLog[]): Totals {
  return logs.reduce(
    (acc, l) =>
      addTotals(acc, {
        kcal: Number(l.kcal),
        proteina: Number(l.proteina),
        carbos: Number(l.carbos),
        grasas: Number(l.grasas),
      }),
    ZERO
  );
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
