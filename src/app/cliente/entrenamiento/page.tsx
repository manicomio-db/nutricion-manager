import { requireClient } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrainingPlan, TrainingPlanRequest, WorkoutLog } from "@/lib/types";
import { todayLocal } from "@/lib/date";
import { analyzeProgress } from "@/lib/progress";
import { ProgressTable } from "@/components/progress-table";
import { WorkoutLogForm } from "@/components/workout-log-form";
import { Button } from "@/components/ui/button";
import { deleteWorkoutLog } from "@/app/progreso-actions";
import { RequestTrainingForm } from "./request-form";
import { FichaRequired } from "@/components/ficha-required";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

export default async function ClienteEntrenamientoPage() {
  const { profile, supabase } = await requireClient();

  const [{ data: plan }, { data: requests }, { data: ficha }, { data: logs }] = await Promise.all([
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
    supabase.from("health_profiles").select("client_id").eq("client_id", profile.id).maybeSingle(),
    supabase
      .from("workout_logs")
      .select("*")
      .eq("client_id", profile.id)
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<WorkoutLog[]>(),
  ]);

  const activeRequest = requests?.find(
    (r) => r.status === "pendiente" || r.status === "en_progreso"
  );

  const planExercises = Array.from(
    new Set((plan?.contenido.dias ?? []).flatMap((d) => d.ejercicios.map((e) => e.nombre)).filter(Boolean))
  );
  const planLogs = (logs ?? []).filter((l) => !plan || l.plan_id === plan.id);
  const progress = analyzeProgress(planLogs);

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
                      <li key={j} className="flex flex-wrap items-center gap-2">
                        <span>
                          {ej.nombre} — {ej.series} series x {ej.reps} reps
                          {ej.notas && <span className="text-muted-foreground"> ({ej.notas})</span>}
                        </span>
                        {ej.video_url && (
                          <a
                            href={ej.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4"
                          >
                            Ver video
                          </a>
                        )}
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

      {plan && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Registra tu progreso</CardTitle>
              <CardDescription>
                Anota el peso y las repeticiones de tus ejercicios para ver cómo avanzas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutLogForm exercises={planExercises} maxDate={todayLocal()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mi progreso con este plan</CardTitle>
              <CardDescription>Cómo empezaste y cómo vas en cada ejercicio.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ProgressTable progress={progress} />
              {planLogs.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Últimos registros</p>
                  {planLogs.slice(0, 10).map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>
                        {l.log_date} — <strong>{l.exercise}</strong>:{" "}
                        {l.sets ? `${l.sets}×` : ""}
                        {l.reps} reps
                        {l.weight_kg ? ` · ${l.weight_kg} kg` : ""}
                      </span>
                      <form action={deleteWorkoutLog}>
                        <input type="hidden" name="id" value={l.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          Borrar
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pedir nuevo plan</CardTitle>
          <CardDescription>Tu entrenador lo revisará y te lo asignará.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ficha ? (
            <FichaRequired />
          ) : activeRequest ? (
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
            <RequestTrainingForm hasPreviousPlan={!!plan} />
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
