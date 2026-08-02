import { requireClient } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrainingPlan, TrainingPlanRequest } from "@/lib/types";
import { RequestTrainingForm } from "./request-form";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

export default async function ClienteEntrenamientoPage() {
  const { profile, supabase } = await requireClient();

  const [{ data: plan }, { data: requests }] = await Promise.all([
    supabase
      .from("training_plans")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<TrainingPlan>(),
    supabase
      .from("training_plan_requests")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<TrainingPlanRequest[]>(),
  ]);

  const activeRequest = requests?.find(
    (r) => r.status === "pendiente" || r.status === "en_progreso"
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi entrenamiento</h1>
        <p className="text-muted-foreground">
          Consulta tu plan de entrenamiento asignado o pide uno nuevo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan actual</CardTitle>
          {plan && (
            <CardDescription>
              {plan.title} · {plan.source === "ia" ? "Generado con IA" : "Manual"}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {plan ? (
            <div className="flex flex-col gap-4">
              {plan.contenido.resumen && (
                <p className="text-sm text-muted-foreground">{plan.contenido.resumen}</p>
              )}
              {plan.contenido.dias?.map((dia, i) => (
                <div key={i} className="rounded-md border p-3">
                  <p className="font-semibold">{dia.dia}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {dia.ejercicios.map((ej, j) => (
                      <li key={j}>
                        {ej.nombre} — {ej.series} series x {ej.reps} reps
                        {ej.notas && <span className="text-muted-foreground"> ({ej.notas})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aún no tienes un plan de entrenamiento asignado.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedir nuevo plan</CardTitle>
          <CardDescription>Tu entrenador lo revisará y te lo asignará.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeRequest ? (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{activeRequest.objetivo}</p>
                <Badge variant="secondary">{STATUS_LABEL[activeRequest.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ya tienes una solicitud en trámite. Cuando tu entrenador te asigne el plan,
                aparecerá arriba y podrás pedir uno nuevo.
              </p>
            </div>
          ) : (
            <RequestTrainingForm />
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
