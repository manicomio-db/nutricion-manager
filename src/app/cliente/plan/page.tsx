import { requireClient } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NutritionPlan, NutritionPlanRequest } from "@/lib/types";
import { NutritionRequestForm } from "./nutrition-request-form";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export default async function ClientePlanPage() {
  const { profile, supabase } = await requireClient();

  const [{ data: plan }, { data: requests }] = await Promise.all([
    supabase
      .from("nutrition_plans")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<NutritionPlan>(),
    supabase
      .from("nutrition_plan_requests")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<NutritionPlanRequest[]>(),
  ]);

  const activeRequest = requests?.find(
    (r) => r.status === "pendiente" || r.status === "en_progreso"
  );

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi plan</h1>
        <p className="text-muted-foreground">
          {profile.objetivo ? `Objetivo: ${profile.objetivo}` : "Tu plan nutricional vigente."}
        </p>
      </div>

      {!plan ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Aún no tienes un plan asignado. Tu nutricionista te lo asignará pronto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription>Totales del día</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm">
              {dayTotals && (
                <>
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
                </>
              )}
            </CardContent>
          </Card>

          {plan.comidas.map((meal, i) => {
            const t = meal.items.reduce(
              (s, it) => ({
                kcal: s.kcal + it.kcal,
                proteina: s.proteina + it.proteina,
                carbos: s.carbos + it.carbos,
                grasas: s.grasas + it.grasas,
              }),
              { kcal: 0, proteina: 0, carbos: 0, grasas: 0 }
            );
            return (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{meal.nombre}</CardTitle>
                  <CardDescription>
                    {round(t.kcal)} kcal · P {round(t.proteina)}g · C {round(t.carbos)}g · G{" "}
                    {round(t.grasas)}g
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1 text-sm">
                    {meal.items.map((item, j) => (
                      <li key={j} className="flex justify-between">
                        <span>
                          {item.food_nombre} — {item.gramos}g
                        </span>
                        <span className="text-muted-foreground">{item.kcal} kcal</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pedir nuevo plan</CardTitle>
          <CardDescription>Tu nutricionista lo revisará y te lo asignará.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeRequest ? (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{activeRequest.objetivo}</p>
                <Badge variant="secondary">{STATUS_LABEL[activeRequest.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ya tienes una solicitud en trámite. Cuando tu nutricionista te asigne el plan,
                aparecerá arriba y podrás pedir uno nuevo.
              </p>
            </div>
          ) : (
            <NutritionRequestForm />
          )}
        </CardContent>
      </Card>

      {requests && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de solicitudes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>{r.objetivo}</span>
                <Badge variant="secondary">{STATUS_LABEL[r.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
