"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { TrainingPlanContent } from "@/lib/types";
import { saveTrainingPlan, markTrainingInProgress, discardTrainingRequest } from "../../actions";

type RequestInfo = {
  id: string;
  clientId: string;
  clientNombre: string;
  objetivo: string;
  nivel: string | null;
  lesiones: string | null;
  sesionesSemana: number | null;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

export function TrainingComposer({ request }: { request: RequestInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(`Plan de entrenamiento para ${request.clientNombre}`);
  const [source, setSource] = useState<"ia" | "manual">("manual");
  const [contenido, setContenido] = useState<TrainingPlanContent>({ resumen: "", dias: [] });

  async function generar() {
    setGenerating(true);
    try {
      const res = await fetch("/api/training/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objetivo: request.objetivo,
          nivel: request.nivel,
          lesiones: request.lesiones,
          sesiones_semana: request.sesionesSemana,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error generando plan");
      setContenido(data.contenido);
      setSource("ia");
      setExpanded(true);
      toast.success("Plan generado. Revísalo antes de guardar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generando plan");
    } finally {
      setGenerating(false);
    }
  }

  function updateDia(i: number, dia: string) {
    setContenido((c) => ({
      ...c,
      dias: c.dias.map((d, idx) => (idx === i ? { ...d, dia } : d)),
    }));
  }

  function addDia() {
    setContenido((c) => ({ ...c, dias: [...c.dias, { dia: `Día ${c.dias.length + 1}`, ejercicios: [] }] }));
    setExpanded(true);
  }

  function removeDia(i: number) {
    setContenido((c) => ({ ...c, dias: c.dias.filter((_, idx) => idx !== i) }));
  }

  function addEjercicio(diaIdx: number) {
    setContenido((c) => ({
      ...c,
      dias: c.dias.map((d, idx) =>
        idx === diaIdx
          ? { ...d, ejercicios: [...d.ejercicios, { nombre: "", series: "3", reps: "10" }] }
          : d
      ),
    }));
  }

  function updateEjercicio(
    diaIdx: number,
    ejIdx: number,
    field: "nombre" | "series" | "reps" | "notas",
    value: string
  ) {
    setContenido((c) => ({
      ...c,
      dias: c.dias.map((d, idx) =>
        idx === diaIdx
          ? {
              ...d,
              ejercicios: d.ejercicios.map((ej, j) => (j === ejIdx ? { ...ej, [field]: value } : ej)),
            }
          : d
      ),
    }));
  }

  function removeEjercicio(diaIdx: number, ejIdx: number) {
    setContenido((c) => ({
      ...c,
      dias: c.dias.map((d, idx) =>
        idx === diaIdx ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== ejIdx) } : d
      ),
    }));
  }

  async function guardar() {
    if (!title.trim() || contenido.dias.length === 0) {
      toast.error("Agrega un título y al menos un día antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      await saveTrainingPlan({
        requestId: request.id,
        clientId: request.clientId,
        title,
        contenido,
        source,
      });
      toast.success("Plan asignado al cliente.");
    } catch {
      toast.error("No se pudo guardar el plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {request.clientNombre} — {request.objetivo}
            </CardTitle>
            <CardDescription>
              Nivel: {request.nivel || "sin especificar"} · {request.sesionesSemana ?? 3} ses/sem
              {request.lesiones ? ` · Lesiones: ${request.lesiones}` : ""}
            </CardDescription>
          </div>
          <Badge variant="secondary">{STATUS_LABEL[request.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={generar} disabled={generating}>
            {generating ? "Generando..." : "Generar con IA"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Ocultar editor" : "Editar manualmente"}
          </Button>
          {request.status === "pendiente" && (
            <form action={markTrainingInProgress}>
              <input type="hidden" name="request_id" value={request.id} />
              <input type="hidden" name="client_id" value={request.clientId} />
              <Button type="submit" variant="ghost">
                Marcar en progreso
              </Button>
            </form>
          )}
          <form
            action={discardTrainingRequest}
            onSubmit={(e) => {
              if (!confirm(`¿Descartar la solicitud de ${request.clientNombre}? No se puede deshacer.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="request_id" value={request.id} />
            <input type="hidden" name="client_id" value={request.clientId} />
            <Button type="submit" variant="ghost" className="text-destructive">
              Descartar
            </Button>
          </form>
        </div>

        {expanded && (
          <div className="flex flex-col gap-4 rounded-md border p-4">
            <div className="flex flex-col gap-2">
              <Label>Título del plan</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Resumen</Label>
              <Textarea
                value={contenido.resumen}
                onChange={(e) => setContenido((c) => ({ ...c, resumen: e.target.value }))}
              />
            </div>

            {contenido.dias.map((dia, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Input value={dia.dia} onChange={(e) => updateDia(i, e.target.value)} />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeDia(i)}>
                    Quitar día
                  </Button>
                </div>
                {dia.ejercicios.map((ej, j) => (
                  <div key={j} className="grid grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2">
                    <Input
                      placeholder="Ejercicio"
                      value={ej.nombre}
                      onChange={(e) => updateEjercicio(i, j, "nombre", e.target.value)}
                    />
                    <Input
                      placeholder="Series"
                      value={ej.series}
                      onChange={(e) => updateEjercicio(i, j, "series", e.target.value)}
                    />
                    <Input
                      placeholder="Reps"
                      value={ej.reps}
                      onChange={(e) => updateEjercicio(i, j, "reps", e.target.value)}
                    />
                    <Input
                      placeholder="Notas"
                      value={ej.notas ?? ""}
                      onChange={(e) => updateEjercicio(i, j, "notas", e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeEjercicio(i, j)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => addEjercicio(i)}>
                  + Ejercicio
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addDia} className="w-fit">
              + Día
            </Button>

            <Button type="button" onClick={guardar} disabled={saving} className="w-fit">
              {saving ? "Guardando..." : "Guardar y asignar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
