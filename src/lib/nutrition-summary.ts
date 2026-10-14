import type { NutritionPlan } from "@/lib/types";

/** Resumen en texto del plan de alimentación vigente, para que el entrenamiento se adapte a él. */
export function nutritionSummaryForPrompt(plan: NutritionPlan): string {
  const total = plan.comidas.reduce(
    (acc, m) => {
      for (const i of m.items) {
        acc.kcal += i.kcal;
        acc.proteina += i.proteina;
        acc.carbos += i.carbos;
        acc.grasas += i.grasas;
      }
      return acc;
    },
    { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  );
  const r = (n: number) => Math.round(n);

  const lines = [
    `- Plan: "${plan.title}"`,
    `- Totales diarios: ${r(total.kcal)} kcal · ${r(total.proteina)} g proteína · ${r(total.carbos)} g carbohidratos · ${r(total.grasas)} g grasas`,
    `- Comidas: ${plan.comidas.length} al día`,
  ];

  const pre = plan.comidas.find((m) => m.momento === "pre");
  const post = plan.comidas.find((m) => m.momento === "post");
  if (pre) lines.push(`- Comida pre-entreno: ${pre.nombre} (${pre.items.map((i) => i.food_nombre).join(", ")})`);
  if (post) lines.push(`- Comida post-entreno: ${post.nombre} (${post.items.map((i) => i.food_nombre).join(", ")})`);
  if (plan.suplementacion?.trim()) lines.push(`- Suplementación: ${plan.suplementacion.trim()}`);

  return lines.join("\n");
}

/** Resumen corto (una línea) del plan de alimentación, para mostrarlo en pantalla. */
export function nutritionOneLine(plan: NutritionPlan): string {
  const total = plan.comidas.reduce(
    (acc, m) => {
      for (const i of m.items) {
        acc.kcal += i.kcal;
        acc.proteina += i.proteina;
        acc.carbos += i.carbos;
        acc.grasas += i.grasas;
      }
      return acc;
    },
    { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  );
  const r = (n: number) => Math.round(n);
  return `${plan.title}: ${r(total.kcal)} kcal · P ${r(total.proteina)} g · C ${r(total.carbos)} g · G ${r(total.grasas)} g · ${plan.comidas.length} comidas`;
}
