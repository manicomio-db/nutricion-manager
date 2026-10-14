"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TrainingPlanContent } from "@/lib/types";
import { updateTrainingPlan } from "../../../actions";

export function TrainingPlanEditor({
  planId,
  clientId,
  initialTitle,
  initialContenido,
}: {
  planId: string;
  clientId: string;
  initialTitle: string;
  initialContenido: TrainingPlanContent;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [contenido, setContenido] = useState<TrainingPlanContent>({
    resumen: initialContenido.resumen ?? "",
    dias: initialContenido.dias ?? [],
  });
  const [saving, setSaving] = useState(false);

  function updateDia(i: number, dia: string) {
    setContenido((c) => ({ ...c, dias: c.dias.map((d, idx) => (idx === i ? { ...d, dia } : d)) }));
  }

  function addDia() {
    setContenido((c) => ({ ...c, dias: [...c.dias, { dia: `Día ${c.dias.length + 1}`, ejercicios: [] }] }));
  }

  function removeDia(i: number) {
    setContenido((c) => ({ ...c, dias: c.dias.filter((_, idx) => idx !== i) }));
  }

  function moveDia(i: number, dir: -1 | 1) {
    setContenido((c) => {
      const j = i + dir;
      if (j < 0 || j >= c.dias.length) return c;
      const dias = [...c.dias];
      [dias[i], dias[j]] = [dias[j], dias[i]];
      return { ...c, dias };
    });
  }

  function addEjercicio(diaIdx: number) {
    setContenido((c) => ({
      ...c,
      dias: c.dias.map((d, idx) =>
        idx === diaIdx
          ? { ...d, ejercicios: [...d.ejercicios, { nombre: "", series: "3", reps: "10", video_url: "" }] }
          : d
      ),
    }));
  }

  function updateEjercicio(
    diaIdx: number,
    ejIdx: number,
    field: "nombre" | "series" | "reps" | "notas" | "video_url",
    value: string
  ) {
    setContenido((c) => ({
      ...c,
      dias: c.dias.map((d, idx) =>
        idx === diaIdx
          ? { ...d, ejercicios: d.ejercicios.map((ej, j) => (j === ejIdx ? { ...ej, [field]: value } : ej)) }
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

  function moveEjercicio(diaIdx: number, ejIdx: number, dir: -1 | 1) {
    setContenido((c) => ({
      ...c,
      dias: c.dias.map((d, idx) => {
        if (idx !== diaIdx) return d;
        const j = ejIdx + dir;
        if (j < 0 || j >= d.ejercicios.length) return d;
        const ejercicios = [...d.ejercicios];
        [ejercicios[ejIdx], ejercicios[j]] = [ejercicios[j], ejercicios[ejIdx]];
        return { ...d, ejercicios };
      }),
    }));
  }

  async function guardar() {
    if (!title.trim() || contenido.dias.length === 0) {
      toast.error("Agrega un título y al menos un día.");
      return;
    }
    setSaving(true);
    try {
      await updateTrainingPlan({ id: planId, clientId, title, contenido });
      toast.success("Plan actualizado. El cliente ya ve los cambios.");
      router.push(`/admin/clientes/${clientId}`);
      router.refresh();
    } catch {
      toast.error("No se pudo guardar el plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
            <Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => moveDia(i, -1)}>
              ↑
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={i === contenido.dias.length - 1}
              onClick={() => moveDia(i, 1)}
            >
              ↓
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeDia(i)}>
              Quitar día
            </Button>
          </div>

          {dia.ejercicios.length > 0 && (
            <div className="grid grid-cols-[2fr_1fr_1fr_2fr_2fr_auto_auto_auto] gap-2 px-1 text-xs font-medium text-muted-foreground">
              <span>Ejercicio</span>
              <span>Series</span>
              <span>Reps</span>
              <span>Notas</span>
              <span>Link de video</span>
              <span />
              <span />
              <span />
            </div>
          )}

          {dia.ejercicios.map((ej, j) => (
            <div key={j} className="grid grid-cols-[2fr_1fr_1fr_2fr_2fr_auto_auto_auto] gap-2">
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
              <Input
                placeholder="https://youtube.com/..."
                value={ej.video_url ?? ""}
                onChange={(e) => updateEjercicio(i, j, "video_url", e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                title="Subir"
                disabled={j === 0}
                onClick={() => moveEjercicio(i, j, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                title="Bajar"
                disabled={j === dia.ejercicios.length - 1}
                onClick={() => moveEjercicio(i, j, 1)}
              >
                ↓
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeEjercicio(i, j)}>
                ✕
              </Button>
            </div>
          ))}

          <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => addEjercicio(i)}>
            + Ejercicio
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addDia} className="w-fit">
        + Día
      </Button>

      <Button type="button" onClick={guardar} disabled={saving} className="w-fit">
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
