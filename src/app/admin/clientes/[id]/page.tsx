import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  NutritionPlan,
  NutritionPlanRequest,
  HealthProfile,
  Payment,
  ProgressLog,
  ProgressPhoto,
  Profile,
  TrainingPlan,
  TrainingPlanRequest,
  WorkoutLog,
} from "@/lib/types";
import { ClientProfileForm } from "./profile-form";
import { ProgressLogForm } from "./progress-form";
import { PaymentForm } from "./payment-form";
import { ProgressChart } from "@/components/progress-chart";
import { PhotoGallery } from "@/components/photo-gallery";
import { DeleteClientButton } from "./delete-client-button";
import { HealthTab } from "./health-tab";
import { ResetPasswordForm } from "./reset-password-form";
import { ageFromBirthDate } from "@/lib/health";
import { analyzeProgress } from "@/lib/progress";
import { nutritionOneLine } from "@/lib/nutrition-summary";
import { ProgressTable } from "@/components/progress-table";
import { WorkoutLogForm } from "@/components/workout-log-form";
import { deleteWorkoutLog } from "../../../progreso-actions";
import { TrainingComposer } from "./training-composer";
import { NutritionAiComposer } from "./nutrition-ai-composer";
import { todayLocal } from "@/lib/date";
import { membershipStatus } from "@/lib/payments";
import {
  deletePlan,
  deletePayment,
  deleteProgressLog,
  deleteProgressPhoto,
  deleteTrainingPlan,
} from "../../actions";

const TRAINING_STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

const NUTRITION_STATUS_LABEL = TRAINING_STATUS_LABEL;

const MEMBERSHIP_LABEL: Record<string, string> = {
  activo: "Activo",
  vencido: "Vencido",
  sin_pago: "Sin pagos registrados",
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [
    { data: client },
    { data: plans },
    { data: logs },
    { data: trainingRequests },
    { data: trainingPlans },
    { data: nutritionRequests },
    { data: payments },
    { data: photos },
    { data: health },
    { data: workoutLogs },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single<Profile>(),
    supabase
      .from("nutrition_plans")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .returns<NutritionPlan[]>(),
    supabase
      .from("progress_logs")
      .select("*")
      .eq("client_id", id)
      .order("fecha", { ascending: true })
      .returns<ProgressLog[]>(),
    supabase
      .from("training_plan_requests")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .returns<TrainingPlanRequest[]>(),
    supabase
      .from("training_plans")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .returns<TrainingPlan[]>(),
    supabase
      .from("nutrition_plan_requests")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .returns<NutritionPlanRequest[]>(),
    supabase
      .from("payments")
      .select("*")
      .eq("client_id", id)
      .order("fecha_vencimiento", { ascending: false })
      .returns<Payment[]>(),
    supabase
      .from("progress_photos")
      .select("*")
      .eq("client_id", id)
      .order("fecha", { ascending: false })
      .returns<ProgressPhoto[]>(),
    supabase.from("health_profiles").select("*").eq("client_id", id).maybeSingle<HealthProfile>(),
    supabase
      .from("workout_logs")
      .select("*")
      .eq("client_id", id)
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300)
      .returns<WorkoutLog[]>(),
  ]);

  if (!client) notFound();

  const activeTrainingRequests = (trainingRequests ?? []).filter((r) => r.status !== "completado");
  const activeNutritionRequests = (nutritionRequests ?? []).filter((r) => r.status !== "completado");
  const latestLog = logs && logs.length > 0 ? logs[logs.length - 1] : null;
  const dietaResumen = plans && plans.length > 0 ? nutritionOneLine(plans[0]) : null;
  const latestTrainingPlan = trainingPlans?.[0] ?? null;
  const latestPlanLogs = (workoutLogs ?? []).filter((l) => latestTrainingPlan && l.plan_id === latestTrainingPlan.id);
  const planExercises = Array.from(
    new Set((latestTrainingPlan?.contenido.dias ?? []).flatMap((d) => d.ejercicios.map((e) => e.nombre)).filter(Boolean))
  );
  const latestPayment = payments?.[0] ?? null;
  const status = membershipStatus(latestPayment?.fecha_vencimiento, todayLocal());

  let galleryPhotos: { id: string; path: string; url: string; fecha: string; notas: string | null }[] = [];
  if (photos && photos.length > 0) {
    const { data: signed } = await supabase.storage
      .from("progress-photos")
      .createSignedUrls(
        photos.map((p) => p.storage_path),
        3600
      );
    galleryPhotos = photos.map((p, i) => ({
      id: p.id,
      path: p.storage_path,
      url: signed?.[i]?.signedUrl ?? "",
      fecha: p.fecha,
      notas: p.notas,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{client.full_name ?? "Cliente"}</h1>
          <p className="text-muted-foreground">{client.objetivo ?? "Sin objetivo definido"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={status === "activo" ? "default" : status === "vencido" ? "destructive" : "secondary"}>
            {MEMBERSHIP_LABEL[status]}
            {latestPayment ? ` · vence ${latestPayment.fecha_vencimiento}` : ""}
          </Badge>
          <DeleteClientButton clientId={id} clientName={client.full_name ?? "este cliente"} />
        </div>
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="ficha">Ficha de salud</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="entrenamiento">Entrenamiento</TabsTrigger>
          <TabsTrigger value="progreso">Progreso</TabsTrigger>
        </TabsList>

        <TabsContent value="datos">
          <Card>
            <CardHeader>
              <CardTitle>Datos del cliente</CardTitle>
              <CardDescription>Objetivo, restricciones y notas.</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientProfileForm client={client} />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Contraseña del socio</CardTitle>
              <CardDescription>
                Si olvidó su contraseña, define una nueva aquí y compártesela. Podrá cambiarla cuando quiera
                contigo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm clientId={id} username={client.username} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ficha">
          <HealthTab clientId={id} clientNombre={client.full_name ?? "El cliente"} health={health ?? null} />
        </TabsContent>

        <TabsContent value="pagos">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registrar pago</CardTitle>
                <CardDescription>Guarda la fecha de pago y hasta cuándo queda cubierto.</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentForm clientId={id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de pagos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {(payments ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <span>
                      Pagó {p.fecha_pago} — vence <strong>{p.fecha_vencimiento}</strong>
                      {p.monto ? ` · $${p.monto}` : ""}
                      {p.notas ? ` · ${p.notas}` : ""}
                    </span>
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="client_id" value={id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Borrar
                      </Button>
                    </form>
                  </div>
                ))}
                {(!payments || payments.length === 0) && (
                  <p className="text-muted-foreground">Aún no hay pagos registrados.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planes">
          <div className="flex flex-col gap-4">
            {activeNutritionRequests.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Solicitudes pendientes
                </h2>
                {activeNutritionRequests.map((r) => (
                  <NutritionAiComposer
                    key={r.id}
                    request={{
                      id: r.id,
                      clientId: r.client_id,
                      clientNombre: client.full_name ?? "Cliente",
                      objetivo: r.objetivo,
                      restricciones: r.restricciones,
                      comidasDia: r.comidas_dia ?? health?.meals_per_day ?? null,
                      preferencias: health?.food_preferences ?? null,
                      notas: r.notas,
                      status: r.status,
                      alturaCm: client.altura_cm ?? health?.height_cm ?? null,
                      edad: health ? ageFromBirthDate(health.birth_date) : null,
                      sexo: health?.sex ?? null,
                      pesoKg: latestLog?.peso_kg ?? health?.weight_kg ?? null,
                      grasaPct: latestLog?.grasa_pct ?? null,
                      grasaVisceral: latestLog?.grasa_visceral ?? null,
                      masaMuscularKg: latestLog?.masa_muscular_kg ?? null,
                      aguaCorporalL: latestLog?.agua_corporal_l ?? null,
                      tasaMetabolicaKcal: latestLog?.tasa_metabolica_kcal ?? null,
                    }}
                  />
                ))}
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Planes nutricionales</CardTitle>
                    <CardDescription>Historial de planes armados para este cliente.</CardDescription>
                  </div>
                  <Button nativeButton={false} render={<Link href={`/admin/clientes/${id}/planes/nuevo`} />}>
                    + Nuevo plan (IA o manual)
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {(plans ?? []).map((p) => {
                  const totalKcal = p.comidas.reduce(
                    (sum, m) => sum + m.items.reduce((s, i) => s + i.kcal, 0),
                    0
                  );
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-md border p-3 text-sm"
                    >
                      <Link href={`/admin/clientes/${id}/planes/${p.id}`} className="flex-1 hover:underline">
                        <span className="font-medium">{p.title}</span>{" "}
                        <span className="text-muted-foreground">
                          · {p.comidas.length} comidas · {Math.round(totalKcal)} kcal/día ·{" "}
                          {p.source === "ia" ? "IA" : "Manual"}
                        </span>
                      </Link>
                      <form action={deletePlan}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="client_id" value={id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          Borrar
                        </Button>
                      </form>
                    </div>
                  );
                })}
                {(!plans || plans.length === 0) && (
                  <p className="text-muted-foreground">Este cliente aún no tiene ningún plan.</p>
                )}
              </CardContent>
            </Card>

            {(nutritionRequests ?? []).filter((r) => r.status === "completado").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes de plan nutricional completadas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {(nutritionRequests ?? [])
                    .filter((r) => r.status === "completado")
                    .slice(0, 10)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-md border p-3 text-sm"
                      >
                        <span>{r.objetivo}</span>
                        <Badge variant="secondary">{NUTRITION_STATUS_LABEL[r.status]}</Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="entrenamiento">
          <div className="flex flex-col gap-4">
            {activeTrainingRequests.length === 0 && (
              <p className="text-muted-foreground">No hay solicitudes de entrenamiento pendientes.</p>
            )}

            {activeTrainingRequests.map((r) => {
              // Plan anterior de la solicitud (o el último plan asignado si no quedó ligado).
              const prevPlan =
                (trainingPlans ?? []).find((p) => p.id === r.prev_plan_id) ?? latestTrainingPlan;
              return (
                <TrainingComposer
                  key={r.id}
                  request={{
                    id: r.id,
                    clientId: r.client_id,
                    clientNombre: client.full_name ?? "Cliente",
                    objetivo: r.objetivo,
                    nivel: r.nivel,
                    lesiones: r.lesiones,
                    sesionesSemana: r.sesiones_semana,
                    status: r.status,
                  }}
                  dietaResumen={dietaResumen}
                  previous={
                    prevPlan
                      ? {
                          title: prevPlan.title,
                          progress: analyzeProgress(
                            (workoutLogs ?? []).filter((l) => l.plan_id === prevPlan.id)
                          ),
                          feedback: r.feedback,
                        }
                      : null
                  }
                />
              );
            })}

            {latestTrainingPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Seguimiento del plan actual</CardTitle>
                  <CardDescription>
                    Registros de peso y repeticiones de «{latestTrainingPlan.title}». Puedes anotar uno a nombre del
                    cliente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ProgressTable progress={analyzeProgress(latestPlanLogs)} />
                  {latestPlanLogs.slice(0, 8).map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>
                        {l.log_date} — <strong>{l.exercise}</strong>: {l.sets ? `${l.sets}×` : ""}
                        {l.reps} reps{l.weight_kg ? ` · ${l.weight_kg} kg` : ""}
                      </span>
                      <form action={deleteWorkoutLog}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="client_id" value={id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          Borrar
                        </Button>
                      </form>
                    </div>
                  ))}
                  <WorkoutLogForm exercises={planExercises} maxDate={todayLocal()} clientId={id} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Planes de entrenamiento asignados</CardTitle>
                <CardDescription>Historial de planes generados para este cliente.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {(trainingPlans ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <span>
                      <span className="font-medium">{p.title}</span>{" "}
                      <span className="text-muted-foreground">
                        · {p.contenido.dias?.length ?? 0} días · {p.source === "ia" ? "IA" : "Manual"}
                      </span>
                    </span>
                    <form action={deleteTrainingPlan}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="client_id" value={id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Borrar
                      </Button>
                    </form>
                  </div>
                ))}
                {(!trainingPlans || trainingPlans.length === 0) && (
                  <p className="text-muted-foreground">Este cliente aún no tiene planes de entrenamiento.</p>
                )}
              </CardContent>
            </Card>

            {(trainingRequests ?? []).filter((r) => r.status === "completado").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes completadas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {(trainingRequests ?? [])
                    .filter((r) => r.status === "completado")
                    .slice(0, 10)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-md border p-3 text-sm"
                      >
                        <span>{r.objetivo}</span>
                        <Badge variant="secondary">{TRAINING_STATUS_LABEL[r.status]}</Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progreso">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fotos de progreso</CardTitle>
                <CardDescription>Subidas por el propio cliente desde su portal.</CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoGallery
                  photos={galleryPhotos}
                  deleteAction={deleteProgressPhoto}
                  extraFields={{ client_id: id }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrar medición</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressLogForm clientId={id} />
              </CardContent>
            </Card>

            {logs && logs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolución</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressChart logs={logs} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Historial</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {(logs ?? [])
                  .slice()
                  .reverse()
                  .map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-md border p-3 text-sm"
                    >
                      <span>
                        {l.fecha} — {l.peso_kg ? `${l.peso_kg}kg` : "sin peso"}
                        {l.grasa_pct ? ` · ${l.grasa_pct}% grasa` : ""}
                        {l.masa_muscular_kg ? ` · ${l.masa_muscular_kg}kg músculo` : ""}
                        {l.masa_grasa_kg ? ` · ${l.masa_grasa_kg}kg grasa` : ""}
                        {l.grasa_visceral ? ` · grasa visceral ${l.grasa_visceral}` : ""}
                        {l.agua_corporal_l ? ` · ${l.agua_corporal_l}L agua` : ""}
                        {l.tasa_metabolica_kcal ? ` · TMB ${l.tasa_metabolica_kcal}kcal` : ""}
                      </span>
                      <form action={deleteProgressLog}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="client_id" value={id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          Borrar
                        </Button>
                      </form>
                    </div>
                  ))}
                {(!logs || logs.length === 0) && (
                  <p className="text-muted-foreground">Aún no hay mediciones registradas.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
