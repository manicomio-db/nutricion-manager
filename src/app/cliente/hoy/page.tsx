import { PageHeader } from "@/components/page-header";
import { requireClient } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MacroRing } from "@/components/macro-ring";
import { addDays, todayLocal } from "@/lib/date";
import { computeWaterGoal, GLASS_ML } from "@/lib/water";
import { logTotals, mealTotals, planTotals, round1 } from "@/lib/daily";
import type {
  HealthProfile,
  MealLog,
  NutritionPlan,
  NutritionPlanRequest,
  ProgressLog,
  WaterLog,
} from "@/lib/types";
import { MealCard } from "./meal-card";
import { DifferentMealForm } from "./different-meal-form";
import { WaterTracker } from "./water-tracker";
import { DeleteLogButton } from "./delete-log-button";

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function HoyPage() {
  const { profile, supabase } = await requireClient();
  const today = todayLocal();
  const since = addDays(today, -6);

  const [
    { data: plan },
    { data: weekMeals },
    { data: weekWater },
    { data: health },
    { data: lastLog },
    { data: lastRequest },
  ] = await Promise.all([
    supabase
      .from("nutrition_plans")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<NutritionPlan>(),
    supabase
      .from("meal_logs")
      .select("*")
      .eq("client_id", profile.id)
      .gte("log_date", since)
      .order("created_at", { ascending: true })
      .returns<MealLog[]>(),
    supabase
      .from("water_logs")
      .select("*")
      .eq("client_id", profile.id)
      .gte("log_date", since)
      .returns<WaterLog[]>(),
    supabase.from("health_profiles").select("*").eq("client_id", profile.id).maybeSingle<HealthProfile>(),
    supabase
      .from("progress_logs")
      .select("*")
      .eq("client_id", profile.id)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle<ProgressLog>(),
    supabase
      .from("nutrition_plan_requests")
      .select("objetivo")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<NutritionPlanRequest, "objetivo">>(),
  ]);

  const todayMeals = (weekMeals ?? []).filter((l) => l.log_date === today);
  const consumed = logTotals(todayMeals);
  const target = planTotals(plan ?? null);
  const totalMeals = plan?.comidas.length ?? 0;
  const done = todayMeals.filter((l) => l.kind === "plan").length;
  const other = todayMeals.filter((l) => l.kind === "otra").length;
  const extras = todayMeals.filter((l) => l.kind === "extra");

  const waterToday = (weekWater ?? []).find((w) => w.log_date === today)?.ml ?? 0;
  const waterGoal = computeWaterGoal({
    pesoKg: lastLog?.peso_kg ?? health?.weight_kg,
    grasaPct: lastLog?.grasa_pct,
    actividad: health?.activity_level,
    objetivo: profile.objetivo ?? lastRequest?.objetivo,
    conditions: health?.conditions,
  });

  const diff = target.kcal > 0 ? Math.round(consumed.kcal - target.kcal) : 0;

  // Resumen de los últimos 7 días.
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const weekRows = days.map((d) => {
    const logs = (weekMeals ?? []).filter((l) => l.log_date === d);
    return {
      date: d,
      planDone: logs.filter((l) => l.kind === "plan").length,
      kcal: Math.round(logTotals(logs).kcal),
      ml: (weekWater ?? []).find((w) => w.log_date === d)?.ml ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={<>Mi día</>} subtitle={<>{new Date(`${today}T12:00:00`).toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}</>} />

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>Consumo de hoy</CardTitle>
            <CardDescription>
              {done} de {totalMeals} comidas cumplidas
              {other > 0 ? ` · ${other} distinta${other > 1 ? "s" : ""}` : ""}
              {extras.length > 0 ? ` · ${extras.length} extra${extras.length > 1 ? "s" : ""}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <MacroRing label="Calorías" value={Math.round(consumed.kcal)} max={Math.round(target.kcal)} unit="kcal" />
              <MacroRing label="Proteína" value={Math.round(consumed.proteina)} max={Math.round(target.proteina)} unit="g" color="var(--chart-3)" />
              <MacroRing label="Carbos" value={Math.round(consumed.carbos)} max={Math.round(target.carbos)} unit="g" color="var(--chart-2)" />
              <MacroRing label="Grasas" value={Math.round(consumed.grasas)} max={Math.round(target.grasas)} unit="g" color="var(--chart-4)" />
            </div>
            <p className="text-sm text-muted-foreground">
              Meta del día: {Math.round(target.kcal)} kcal · P {Math.round(target.proteina)}g · C{" "}
              {Math.round(target.carbos)}g · G {Math.round(target.grasas)}g.{" "}
              {diff > 0 ? (
                <span className="font-medium text-warning">Llevas {diff} kcal por encima de tu meta.</span>
              ) : null}
            </p>
          </CardContent>
        </Card>
      )}

      {plan ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Mis comidas de hoy
          </h2>
          {plan.comidas.map((meal, i) => (
            <MealCard
              key={i}
              mealIndex={i}
              nombre={meal.nombre}
              momento={meal.momento}
              items={meal.items}
              totals={mealTotals(meal)}
              log={todayMeals.find((l) => l.meal_index === i && l.kind !== "extra") ?? null}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Aún no tienes un plan de alimentación asignado. Mientras tanto puedes registrar tu agua y lo que
            comes.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registrar otra comida</CardTitle>
          <CardDescription>
            ¿Comiste algo que no estaba en tu plan? Descríbelo y te doy el desglose de calorías y macros.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {extras.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{l.descripcion}</p>
                <p className="text-muted-foreground">
                  {round1(Number(l.kcal))} kcal · P {round1(Number(l.proteina))}g · C {round1(Number(l.carbos))}g · G{" "}
                  {round1(Number(l.grasas))}g
                </p>
              </div>
              <DeleteLogButton id={l.id} />
            </div>
          ))}
          <DifferentMealForm mealIndex={null} placeholder="Ej: una torta de jamón y un jugo de naranja" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agua</CardTitle>
          <CardDescription>
            {waterGoal
              ? "Tu meta de hoy según tu composición corporal, actividad y objetivo."
              : "Registra tus vasos del día."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <WaterTracker consumedMl={waterToday} goalMl={waterGoal?.ml ?? null} />

          {waterGoal ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">¿Cómo se calcula mi meta?</summary>
              <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                {waterGoal.breakdown.map((b) => (
                  <li key={b}>{b}</li>
                ))}
                <li>
                  Total: <strong className="text-foreground">{waterGoal.ml} ml</strong> ({waterGoal.glasses} vasos de{" "}
                  {GLASS_ML} ml)
                </li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Es una guía general. Si sudas mucho o hace calor, puede que necesites un poco más.
              </p>
            </details>
          ) : (
            <p className="text-sm text-muted-foreground">
              Para calcular cuánta agua necesitas, llena tu ficha de salud con tu peso (y tu nutriólogo puede
              registrar tu composición corporal).
            </p>
          )}
          {waterGoal?.caution && <p className="text-sm font-medium text-warning">{waterGoal.caution}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos 7 días</CardTitle>
          <CardDescription>Tu constancia con las comidas del plan y el agua.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {weekRows.map((row) => {
            const waterPct = waterGoal ? Math.min(100, Math.round((row.ml / waterGoal.ml) * 100)) : null;
            return (
              <div key={row.date} className="flex items-center justify-between gap-3 rounded-md border p-2.5 text-sm">
                <span className="w-24 first-letter:uppercase">{dayLabel(row.date)}</span>
                <span className="text-muted-foreground">
                  {plan ? `${row.planDone}/${totalMeals} comidas · ` : ""}
                  {row.kcal} kcal
                </span>
                <span className={waterPct !== null && waterPct >= 100 ? "font-medium text-primary" : "text-muted-foreground"}>
                  💧 {(row.ml / 1000).toFixed(1)} L{waterPct !== null ? ` (${waterPct}%)` : ""}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
