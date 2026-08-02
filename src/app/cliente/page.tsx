import Link from "next/link";
import { requireClient } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MacroRing } from "@/components/macro-ring";
import { Dumbbell, BookOpen, Scale } from "lucide-react";
import type { NutritionPlan, ProgressLog, TrainingPlan } from "@/lib/types";

export default async function ClienteInicioPage() {
  const { profile, supabase } = await requireClient();

  const [{ data: plan }, { data: trainingPlan }, { data: lastLog }] = await Promise.all([
    supabase
      .from("nutrition_plans")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<NutritionPlan>(),
    supabase
      .from("training_plans")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<TrainingPlan>(),
    supabase
      .from("progress_logs")
      .select("*")
      .eq("client_id", profile.id)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle<ProgressLog>(),
  ]);

  const dayTotals = plan?.comidas.reduce(
    (acc, m) => {
      const t = m.items.reduce(
        (s, i) => ({
          kcal: s.kcal + i.kcal,
          proteina: s.proteina + i.proteina,
          carbos: s.carbos + i.carbos,
          grasas: s.grasas + i.grasas,
        }),
        { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
      );
      return {
        kcal: acc.kcal + t.kcal,
        proteina: acc.proteina + t.proteina,
        carbos: acc.carbos + t.carbos,
        grasas: acc.grasas + t.grasas,
      };
    },
    { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
  );

  const firstDay = trainingPlan?.contenido.dias?.[0];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">
          Hola, {profile.full_name?.split(" ")[0] ?? "👋"}
        </h1>
        <p className="text-muted-foreground">Este es tu resumen de hoy.</p>
      </div>

      <Card className="neon-border">
        <CardHeader>
          <CardTitle>Macros de hoy</CardTitle>
          <CardDescription>
            {plan ? plan.title : "Aún no tienes un plan asignado."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dayTotals ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MacroRing label="Calorías" value={dayTotals.kcal} max={dayTotals.kcal} unit="kcal" color="var(--chart-1)" />
              <MacroRing label="Proteína" value={dayTotals.proteina} max={dayTotals.proteina} unit="g" color="var(--chart-2)" />
              <MacroRing label="Carbos" value={dayTotals.carbos} max={dayTotals.carbos} unit="g" color="var(--chart-3)" />
              <MacroRing label="Grasas" value={dayTotals.grasas} max={dayTotals.grasas} unit="g" color="var(--chart-4)" />
            </div>
          ) : (
            <Button nativeButton={false} render={<Link href="/cliente/plan" />} variant="outline" className="w-fit">
              Pedir mi plan nutricional
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            <CardTitle>Tu entrenamiento</CardTitle>
          </div>
          {trainingPlan ? (
            <CardDescription>{trainingPlan.title}</CardDescription>
          ) : (
            <CardDescription>Aún no tienes un plan de entrenamiento asignado.</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {firstDay && (
            <p className="text-sm text-muted-foreground">
              {firstDay.dia} · {firstDay.ejercicios.length} ejercicios
            </p>
          )}
          <Button
            nativeButton={false}
            render={<Link href="/cliente/entrenamiento" />}
            className="w-fit"
          >
            {trainingPlan ? "Ver plan completo" : "Pedir plan de entrenamiento"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-6 text-center">
            <Scale className="size-5 text-primary" />
            <p className="text-2xl font-bold">{lastLog?.peso_kg ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {lastLog ? `kg · ${lastLog.fecha}` : "Sin mediciones aún"}
            </p>
          </CardContent>
        </Card>

        <Link href="/cliente/aprender">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col items-center gap-1 pt-6 text-center">
              <BookOpen className="size-5 text-primary" />
              <p className="font-semibold">Aprender</p>
              <p className="text-xs text-muted-foreground">ManicomioTips</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
