import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { todayLocal } from "@/lib/date";
import {
  ACTIVITY_LABEL,
  RISK_LABEL,
  SEX_LABEL,
  ageFromBirthDate,
  assessRisk,
  bmi,
  bmiCategory,
} from "@/lib/health";
import type { HealthProfile } from "@/lib/types";
import { HealthProfileForm } from "../../../health-profile-form";

export function HealthTab({
  clientId,
  clientNombre,
  health,
}: {
  clientId: string;
  clientNombre: string;
  health: HealthProfile | null;
}) {
  const risk = health ? assessRisk(health) : null;
  const imc = health ? bmi(health.weight_kg, health.height_cm) : null;

  return (
    <div className="flex flex-col gap-6">
      {health && risk ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Resumen de salud</CardTitle>
              <Badge
                variant={
                  risk.level === "consultar_medico"
                    ? "destructive"
                    : risk.level === "precaucion"
                      ? "secondary"
                      : "default"
                }
              >
                {RISK_LABEL[risk.level]}
              </Badge>
            </div>
            <CardDescription>
              {ageFromBirthDate(health.birth_date)} años
              {health.sex ? ` · ${SEX_LABEL[health.sex]}` : ""}
              {health.weight_kg ? ` · ${health.weight_kg} kg` : ""}
              {health.height_cm ? ` · ${health.height_cm} cm` : ""}
              {imc ? ` · IMC ${imc} (${bmiCategory(imc)})` : ""}
              {health.activity_level ? ` · ${ACTIVITY_LABEL[health.activity_level]}` : ""}
            </CardDescription>
          </CardHeader>
          {risk.reasons.length > 0 && (
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {risk.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Es un aviso orientativo, no un diagnóstico. La IA ya toma estos datos en cuenta al generar planes.
              </p>
            </CardContent>
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Este cliente todavía no ha llenado su ficha de salud. Puede hacerlo desde su portal o puedes llenarla
            tú aquí abajo.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{health ? "Editar ficha de salud" : "Llenar ficha de salud"}</CardTitle>
          <CardDescription>
            {health
              ? `Última actualización: ${new Date(health.updated_at).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}`
              : "Se guarda a nombre del cliente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HealthProfileForm clientId={clientId} nombre={clientNombre} initial={health} maxDate={todayLocal()} />
        </CardContent>
      </Card>
    </div>
  );
}
